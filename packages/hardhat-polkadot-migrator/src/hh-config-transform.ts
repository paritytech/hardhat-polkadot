import jscodeshiftFactory, {
    Collection,
    Program,
    Expression,
    ArrayExpression,
    ObjectExpression,
    Literal,
    ObjectProperty,
    NullLiteral,
    BooleanLiteral,
    NumericLiteral,
    StringLiteral,
    ExportDefaultDeclaration,
} from "jscodeshift"

type JSONPrimitive = null | boolean | number | string
type JSONValue = JSONPrimitive | JSONValue[] | { [k: string]: JSONValue }
type ASTValue =
    | NullLiteral
    | BooleanLiteral
    | NumericLiteral
    | StringLiteral
    | ArrayExpression
    | ObjectExpression

/**
 * Adds a default import of provided `module` into the source code.
 *
 * ESM:  `import polkadot from "@parity/hardhat-polkadot"`
 * CJS:  `const polkadot = require("@parity/hardhat-polkadot")`
 */
export function insertImport(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
    module: string,
) {
    const program: Program = root.get().node.program
    const isESM = root.find(j.ImportDeclaration).size() > 0

    // Check if import already exists
    const esmImport = { source: { value: module } }
    const cjsImport = {
        callee: { type: "Identifier" as const, name: "require" as const },
        arguments: [{ type: "StringLiteral" as const, value: module }],
    }
    const existingImports =
        root.find(j.ImportDeclaration, esmImport).length +
        root.find(j.CallExpression, cjsImport).length

    // Insert import if missing
    if (!existingImports) {
        const stmt = isESM
            ? j.importDeclaration(
                  [j.importDefaultSpecifier(j.identifier("polkadot"))],
                  j.stringLiteral(module),
              )
            : j.variableDeclaration("const", [
                  j.variableDeclarator(
                      j.identifier("polkadot"),
                      j.callExpression(j.identifier("require"), [j.stringLiteral(module)]),
                  ),
              ])
        program.body.splice(0, 0, stmt)
    }
}

/**
 * Extract an `ObjectExpression` from some generic `Expression` by
 * deeply unwrapping. Returns null if there is no `ObjectExpression`.
 */
function extractObject(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
    expr: Expression | null | undefined,
): ObjectExpression | null {
    if (j.Identifier.check(expr)) {
        const varDecl = root.find(j.VariableDeclarator, { id: { name: expr.name } }).paths()[0]
        if (varDecl) expr = varDecl.value.init
    }
    while (
        expr &&
        (j.TSAsExpression.check(expr) ||
            j.TSSatisfiesExpression.check(expr) ||
            j.ParenthesizedExpression.check(expr))
    ) {
        expr = expr.expression
    }
    if (
        expr &&
        j.CallExpression.check(expr) &&
        j.Identifier.check(expr.callee) &&
        expr.callee.name === "defineConfig" &&
        expr.arguments[0]
    ) {
        return extractObject(root, j, expr.arguments[0])
    }

    return expr && j.ObjectExpression.check(expr) ? expr : null
}

/**
 * Find the default export config object in source code
 */
function getDefaultExport(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
): ObjectExpression | undefined {
    const targets: ObjectExpression[] = []

    // Handles [ESM] `export default cfg` or `export default { ... }`
    root.find(j.ExportDefaultDeclaration).forEach((p) => {
        const obj = extractObject(root, j, p.value.declaration)
        if (obj) targets.push(obj)
    })

    // Handles [CJS] `module.exports = cfg` or `module.exports = { ... }`
    root.find(j.AssignmentExpression, {
        operator: "=",
        left: {
            type: "MemberExpression",
            object: { name: "module" },
            property: { name: "exports" },
        },
    }).forEach((p) => {
        const obj = extractObject(root, j, p.value.right)
        if (obj) targets.push(obj)
    })

    // Handles [TS CJS] `export = <expr>`
    root.find(j.TSExportAssignment).forEach((p) => {
        const obj = extractObject(root, j, p.value.expression)
        if (obj) targets.push(obj)
    })

    return targets.at(-1)
}

/**
 * Extract an `ObjectProperty` from an `ObjectExpression` by name
 */
function getProp(
    j: jscodeshiftFactory.JSCodeshift,
    obj: ObjectExpression,
    name: string,
): ObjectProperty | undefined {
    return obj.properties.find((p): p is ObjectProperty => {
        return (
            j.ObjectProperty.check(p) &&
            ((j.Identifier.check(p.key) && p.key.name === name) ||
                (j.StringLiteral.check(p.key) && p.key.value === name))
        )
    })
}

/**
 * Merges provided `patch` into the default export of source code given by `root`
 */
export function patchExportConfig(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
    patch: { [k: string]: JSONValue },
) {
    function toAST(v: JSONValue): ASTValue {
        if (v === null) return j.nullLiteral()
        if (typeof v === "boolean") return j.booleanLiteral(v)
        if (typeof v === "number") return j.numericLiteral(v)
        if (typeof v === "string") return j.stringLiteral(v)
        if (Array.isArray(v)) return j.arrayExpression(v.map(toAST))
        if (typeof v === "object") {
            return j.objectExpression(
                Object.entries(v).map(([k, val]) =>
                    j.property(
                        "init",
                        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? j.identifier(k) : j.literal(k),
                        toAST(val),
                    ),
                ),
            )
        }
        throw new Error(`Unsupported primitive: ${JSON.stringify(v)}`)
    }

    function isSamePrimitive(node: Literal, v: JSONValue) {
        if (!node) return false
        return node.value === v
    }

    function ensureObjectProperty(obj: ObjectExpression, name: string): ObjectExpression {
        let prop = getProp(j, obj, name)

        if (!prop) {
            prop = j.objectProperty(
                /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? j.identifier(name) : j.literal(name),
                j.objectExpression([]),
            )
            obj.properties.push(prop)
            return prop.value as ObjectExpression
        }

        prop.shorthand = false
        if (j.ObjectExpression.check(prop.value)) return prop.value
        const resolved = extractObject(root, j, prop.value)
        if (resolved) return resolved

        if (
            !j.RestElement.check(prop.value) &&
            !j.SpreadElementPattern.check(prop.value) &&
            !j.PropertyPattern.check(prop.value) &&
            !j.ObjectPattern.check(prop.value) &&
            !j.ArrayPattern.check(prop.value) &&
            !j.SpreadPropertyPattern.check(prop.value) &&
            !j.TSParameterProperty.check(prop.value) &&
            !j.AssignmentPattern.check(prop.value)
        ) {
            const expr = prop.value
            prop.value = j.objectExpression([j.spreadElement(expr)])
        }

        return prop.value as ObjectExpression
    }

    function deepMerge(obj: ObjectExpression, patch: { [k: string]: JSONValue }) {
        for (const [k, v] of Object.entries(patch)) {
            const prop = getProp(j, obj, k)

            if (v && typeof v === "object" && !Array.isArray(v)) {
                const container = ensureObjectProperty(obj, k)
                deepMerge(container as ObjectExpression, v)
                continue
            }

            if (!prop) {
                obj.properties.push(
                    j.property(
                        "init",
                        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? j.identifier(k) : j.literal(k),
                        toAST(v),
                    ),
                )
            } else if (!isSamePrimitive(prop.value as Literal, v)) {
                prop.value = toAST(v)
            }
        }
    }

    const target = getDefaultExport(root, j)
    if (target) deepMerge(target, patch)
}

/**
 * Adds `plugins: [<identifier>]` to the default export config object
 */
export function addPluginsArray(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
    identifier: string,
) {
    const target = getDefaultExport(root, j)
    if (!target) return

    // Skip if plugins property already exists
    if (getProp(j, target, "plugins")) return

    // Add plugins: [identifier] as first property
    const pluginsProp = j.property(
        "init",
        j.identifier("plugins"),
        j.arrayExpression([j.identifier(identifier)]),
    )
    target.properties.unshift(pluginsProp)
}

/**
 * Wraps the default export in `defineConfig()` if not already wrapped,
 * and adds the corresponding import.
 */
export function wrapWithDefineConfig(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
) {
    const isESM = root.find(j.ImportDeclaration).size() > 0

    // Wrap ESM: export default <expr> → export default defineConfig(<expr>)
    root.find(j.ExportDefaultDeclaration).forEach((p) => {
        const decl = p.value.declaration
        if (
            j.CallExpression.check(decl) &&
            j.Identifier.check(decl.callee) &&
            decl.callee.name === "defineConfig"
        ) {
            return // already wrapped
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p.value.declaration = j.callExpression(j.identifier("defineConfig"), [decl as any])
    })

    // Wrap CJS: module.exports = <expr> → module.exports = defineConfig(<expr>)
    root.find(j.AssignmentExpression, {
        operator: "=",
        left: {
            type: "MemberExpression",
            object: { name: "module" },
            property: { name: "exports" },
        },
    }).forEach((p) => {
        const right = p.value.right
        if (
            j.CallExpression.check(right) &&
            j.Identifier.check(right.callee) &&
            right.callee.name === "defineConfig"
        ) {
            return // already wrapped
        }
        p.value.right = j.callExpression(j.identifier("defineConfig"), [right])
    })

    // Add defineConfig import/require if not present
    const hasDefineConfig =
        root
            .find(j.ImportDeclaration, { source: { value: "hardhat/config" } })
            .filter((p) =>
                p.value.specifiers?.some(
                    (s) => j.ImportSpecifier.check(s) && s.imported.name === "defineConfig",
                ),
            )
            .size() > 0

    if (!hasDefineConfig) {
        const program: Program = root.get().node.program

        if (isESM) {
            // Check if there's an existing hardhat/config import to extend
            const existing = root.find(j.ImportDeclaration, {
                source: { value: "hardhat/config" },
            })
            if (existing.size() > 0) {
                existing.forEach((p) => {
                    p.value.specifiers = p.value.specifiers || []
                    p.value.specifiers.push(j.importSpecifier(j.identifier("defineConfig")))
                })
            } else {
                const stmt = j.importDeclaration(
                    [j.importSpecifier(j.identifier("defineConfig"))],
                    j.stringLiteral("hardhat/config"),
                )
                // Insert after last import
                const lastImportIdx = program.body.reduce(
                    (acc: number, node: Program["body"][number], i: number) =>
                        j.ImportDeclaration.check(node) ? i : acc,
                    -1,
                )
                program.body.splice(lastImportIdx + 1, 0, stmt)
            }
        } else {
            // CJS: const { defineConfig } = require("hardhat/config")
            const stmt = j.variableDeclaration("const", [
                j.variableDeclarator(
                    j.objectPattern([
                        j.objectProperty(j.identifier("defineConfig"), j.identifier("defineConfig")),
                    ]),
                    j.callExpression(j.identifier("require"), [j.stringLiteral("hardhat/config")]),
                ),
            ])
            program.body.splice(0, 0, stmt)
        }
    }
}
