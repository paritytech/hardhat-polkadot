import jscodeshiftFactory, {
    Collection,
    Node,
    Program,
    Expression,
    ArrayExpression,
    ObjectExpression,
    Literal,
    ObjectProperty,
} from "jscodeshift"

type JSONPrimitive = string | number | boolean | null
type JSONValue = JSONPrimitive | JSONValue[] | { [k: string]: JSONValue }

// Adds import of provided `module` into the source code given by `root`
export function insertImport(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
    module: string,
) {
    const program: Program = root.get().node.program
    const isESM = root.find(j.ImportDeclaration).size() > 0

    const esmImport = { source: { value: module } }
    const cjsImport = {
        callee: { type: "Identifier" as const, name: "require" as const },
        arguments: [{ type: "StringLiteral" as const, value: module }],
    }

    const existingImports =
        root.find(j.ImportDeclaration, esmImport).length +
        root.find(j.CallExpression, cjsImport).length
    if (!existingImports) {
        const stmt = isESM
            ? j.importDeclaration([], j.stringLiteral(module))
            : j.expressionStatement(
                  j.callExpression(j.identifier("require"), [j.stringLiteral(module)]),
              )
        program.body.splice(0, 0, stmt)
    }
    root.find(j.ExportDefaultDeclaration, { declaration: { type: "ObjectExpression" } }).forEach(
        (p) => console.log(p),
    )
}

// Merges provided `patch` into the default export of source code given by `root`
export function patchExportConfig(
    root: Collection<ReturnType<typeof jscodeshiftFactory>>,
    j: jscodeshiftFactory.JSCodeshift,
    patch: { [k: string]: JSONValue },
) {
    // const isObj = (n: Node) => n && n.type === "ObjectExpression"
    function lit(v: JSONValue): Expression | ArrayExpression | ObjectExpression {
        if (v === null) return j.nullLiteral()
        if (Array.isArray(v)) return j.arrayExpression(v.map(lit) as Literal[]) // TODO! check correct typing here
        switch (typeof v) {
            case "boolean":
                return j.booleanLiteral(v)
            case "number":
                return j.numericLiteral(v)
            case "string":
                return j.stringLiteral(v)
            case "object":
                return j.objectExpression(
                    Object.entries(v).map(([k, val]) =>
                        j.property(
                            "init",
                            /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? j.identifier(k) : j.literal(k),
                            lit(val) as Literal, // TODO! check correct typing here
                        ),
                    ),
                )
            default:
                return j.nullLiteral()
        }
    }

    function getProp(obj: ObjectExpression, name: string): ObjectProperty | undefined {
        return obj.properties.find((p): p is ObjectProperty => {
            if (p.type !== "Property" && p.type !== "ObjectProperty") return false
            const k = p.key
            return (
                (k.type === "Identifier" && k.name === name) ||
                ((k.type === "StringLiteral" || k.type === "Literal") && k.value === name)
            )
        })
    }

    function unwrapObj(expr: Expression | null | undefined): ObjectExpression | null {
        while (
            expr &&
            (j.TSAsExpression.check(expr) ||
                j.TSSatisfiesExpression.check(expr) ||
                j.ParenthesizedExpression.check(expr))
        )
            expr = expr.expression
        if (
            expr &&
            j.CallExpression.check(expr) &&
            expr.callee.type === "Identifier" &&
            expr.callee.name === "defineConfig" &&
            expr.arguments[0]
        ) {
            return unwrapObj(expr.arguments[0])
        }

        return expr && j.ObjectExpression.check(expr) ? expr : null
    }

    function resolveIdentToObj(name: string) {
        const vd = root.find(j.VariableDeclarator, { id: { name } }).paths()[0]
        return vd ? unwrapObj(vd.value.init) : null
    }

    function isSamePrimitive(node: Literal, v: JSONValue) {
        if (!node) return false
        return node.value === v
    }

    /** Ensure objExpr[name] is an ObjectExpression:
     *  - create if missing
     *  - clear shorthand
     *  - if value is Identifier and resolves to object, return resolved
     *  - else wrap with `{ ...old }` to preserve data
     */
    function ensureContainer(
        objExpr: ObjectExpression,
        name: string,
    ): { node: Node; changed: boolean } {
        let changed = false
        let prop = getProp(objExpr, name)

        if (!prop) {
            prop = j.objectProperty(
                /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? j.identifier(name) : j.literal(name),
                j.objectExpression([]),
            )
            objExpr.properties.push(prop)
            return { node: prop.value, changed: true }
        }

        if (j.ObjectProperty.check(prop) && prop.shorthand) {
            prop.shorthand = false
            changed = true
        }

        if (j.ObjectExpression.check(prop.value)) return { node: prop.value, changed }

        if (prop.value?.type === "Identifier") {
            const resolved = resolveIdentToObj(prop.value.name)
            if (resolved) return { node: resolved, changed }
        }

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
            const expr = prop.value // ExpressionKind now
            prop.value = j.objectExpression([j.spreadElement(expr)])
            changed = true
        }

        return { node: prop.value, changed: true }
    }

    // Deeply merge some arbitrary `patch` into some `objExpr`
    function deepMerge(objExpr: ObjectExpression, patch: { [k: string]: JSONValue }) {
        for (const [k, v] of Object.entries(patch)) {
            const prop = getProp(objExpr, k)

            if (v && typeof v === "object" && !Array.isArray(v)) {
                const { node: container, changed: _ } = ensureContainer(objExpr, k)
                deepMerge(container as ObjectExpression, v)
                continue
            }

            if (!prop) {
                objExpr.properties.push(
                    j.property(
                        "init",
                        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? j.identifier(k) : j.literal(k),
                        lit(v) as Literal, // TODO! check correct typing here
                    ),
                )
            } else if (!isSamePrimitive(prop.value as Literal, v)) {
                prop.value = lit(v) as Literal // TODO! check correct typing here
            }
        }
    }

    const targets: ObjectExpression[] = []

    // Handles [ESM] `export default cfg` or `export default { ... }`
    root.find(j.ExportDefaultDeclaration).forEach((p) => {
        const decl = p.value.declaration
        const obj = decl.type === "Identifier" ? resolveIdentToObj(decl.name) : unwrapObj(decl)
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
        const rhs = p.value.right
        const obj = rhs.type === "Identifier" ? resolveIdentToObj(rhs.name) : unwrapObj(rhs)
        if (obj) targets.push(obj)
    })

    // Handles [TS CJS] `export = <expr>`
    root.find(j.TSExportAssignment).forEach((p) => {
        const rhs = p.value.expression
        const obj = rhs.type === "Identifier" ? resolveIdentToObj(rhs.name) : unwrapObj(rhs)
        if (obj) targets.push(obj)
    })

    for (const cfgObj of targets) {
        deepMerge(cfgObj, patch)
    }
}
