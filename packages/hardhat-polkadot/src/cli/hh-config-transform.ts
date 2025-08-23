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
 * Adds import of provided `module` into the source code given by `root`
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
            ? j.importDeclaration([], j.stringLiteral(module))
            : j.expressionStatement(
                  j.callExpression(j.identifier("require"), [j.stringLiteral(module)]),
              )
        program.body.splice(0, 0, stmt)
    }
}

/**
 * Merges provided `patch` into the default export of source code given by `root`
 */
export function patchExportConfig(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
    patch: { [k: string]: JSONValue },
) {
    /**
     * Convert js/ts primitives into AST nodes
     */
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

    /**
     * Extract an `ObjectProperty` from an `ObjectExpression` by name
     */
    function getProp(obj: ObjectExpression, name: string): ObjectProperty | undefined {
        return obj.properties.find((p): p is ObjectProperty => {
            return (
                j.ObjectProperty.check(p) &&
                ((j.Identifier.check(p.key) && p.key.name === name) ||
                    (j.StringLiteral.check(p.key) && p.key.value === name))
            )
        })
    }

    /**
     * Extract an `ObjectExpression` from some generic `Expression` by
     * deeply unwrapping
     *
     * returns null if no there is no `ObjectExpression`
     */
    function extractObject(expr: Expression | null | undefined): ObjectExpression | null {
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
            return extractObject(expr.arguments[0])
        }

        return expr && j.ObjectExpression.check(expr) ? expr : null
    }

    /**
     * Check if an existing value matches some JSONValue
     */
    function isSamePrimitive(node: Literal, v: JSONValue) {
        if (!node) return false
        return node.value === v
    }

    /**
     * Ensures a property of some `ObjectExpression` to
     * be an `ObjectExpression` itself
     */
    function ensureObjectProperty(obj: ObjectExpression, name: string): ObjectExpression {
        let prop = getProp(obj, name)

        // If missing, set `name: {}`
        if (!prop) {
            prop = j.objectProperty(
                /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? j.identifier(name) : j.literal(name),
                j.objectExpression([]),
            )
            obj.properties.push(prop)
            return prop.value as ObjectExpression
        }

        // Clear shorthand: `{ name }` --> `{ name: name }`
        prop.shorthand = false
        if (j.ObjectExpression.check(prop.value)) return prop.value
        const resolved = extractObject(prop.value)
        if (resolved) return resolved

        // Coerce type & handle
        // `propName: variable` --> `propName: { ...variable }`
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

    /**
     * Deeply merge some arbitrary `patch` into some `ObjectExpression`
     */
    function deepMerge(obj: ObjectExpression, patch: { [k: string]: JSONValue }) {
        for (const [k, v] of Object.entries(patch)) {
            const prop = getProp(obj, k)

            // Recursively merge deeper objects
            if (v && typeof v === "object" && !Array.isArray(v)) {
                const container = ensureObjectProperty(obj, k)
                deepMerge(container as ObjectExpression, v)
                continue
            }

            // Assign value to new property
            if (!prop) {
                obj.properties.push(
                    j.property(
                        "init",
                        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? j.identifier(k) : j.literal(k),
                        toAST(v),
                    ),
                )
            }
            // Overwrite value of existing property
            else if (!isSamePrimitive(prop.value as Literal, v)) {
                prop.value = toAST(v)
            }
        }
    }

    /**
     * Find the default export object in source code
     */
    function getDefaultExport() {
        const targets: ObjectExpression[] = []

        // Handles [ESM] `export default cfg` or `export default { ... }`
        root.find(j.ExportDefaultDeclaration).forEach((p) => {
            const obj = extractObject(p.value.declaration)
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
            const obj = extractObject(p.value.right)
            if (obj) targets.push(obj)
        })

        // Handles [TS CJS] `export = <expr>`
        root.find(j.TSExportAssignment).forEach((p) => {
            const obj = extractObject(p.value.expression)
            if (obj) targets.push(obj)
        })

        return targets.at(-1)
    }

    // Apply patch to the default export
    const target = getDefaultExport()
    if (target) deepMerge(target, patch)
}
