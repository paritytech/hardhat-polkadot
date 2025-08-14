import type { Collection, Program } from "jscodeshift"
import jscodeshiftFactory from "jscodeshift"

// Adds import of provided `module` into the source code given by `root`
export function insertImport(
    root: Collection<any>,
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

    if (
        root.find(j.ImportDeclaration, esmImport).length +
            root.find(j.CallExpression, cjsImport).length ==
        0
    ) {
        const stmt = isESM
            ? j.importDeclaration([], j.stringLiteral(module))
            : j.expressionStatement(
                  j.callExpression(j.identifier("require"), [j.stringLiteral(module)]),
              )
        program.body.splice(0, 0, stmt)
    } else {
        console.log("some found")
    }

    root.find(j.ExportDefaultDeclaration, { declaration: { type: "ObjectExpression" } }).forEach(
        (p) => console.log(p),
    )
}

// Merges provided `patch` into the default export of source code given by `root`
export function patchExportConfig(
    root: Collection<any>,
    j: jscodeshiftFactory.JSCodeshift,
    patch: object,
) {
    const isObj = (n: any) => n && n.type === "ObjectExpression"
    function lit(v: any): any {
        if (v === null) return j.nullLiteral()
        if (Array.isArray(v)) return j.arrayExpression(v.map(lit))
        switch (typeof v) {
            case "boolean":
                return j.booleanLiteral(v)
            case "number":
                return j.literal(v)
            case "string":
                return (j as any).stringLiteral ? (j as any).stringLiteral(v) : j.literal(v)
            case "object":
                return j.objectExpression(
                    Object.entries(v).map(([k, val]) =>
                        j.property(
                            "init",
                            /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? j.identifier(k) : j.literal(k),
                            lit(val),
                        ),
                    ),
                )
            default:
                return j.literal(null)
        }
    }

    function getProp(obj: any, name: string) {
        return obj.properties.find((p: any) => {
            if (p.type !== "Property" && p.type !== "ObjectProperty") return false
            const k = p.key
            return (
                (k.type === "Identifier" && k.name === name) ||
                ((k.type === "StringLiteral" || k.type === "Literal") && k.value === name)
            )
        })
    }

    function unwrapObj(expr: any): any | null {
        while (
            expr &&
            (expr.type === "TSAsExpression" ||
                expr.type === "TSSatisfiesExpression" ||
                expr.type === "ParenthesizedExpression")
        )
            expr = expr.expression
        if (
            expr &&
            expr.type === "CallExpression" &&
            expr.callee.type === "Identifier" &&
            expr.callee.name === "defineConfig" &&
            expr.arguments[0]
        ) {
            return unwrapObj(expr.arguments[0])
        }

        return expr && expr.type === "ObjectExpression" ? expr : null
    }

    function resolveIdentToObj(name: string) {
        const vd = root.find(j.VariableDeclarator, { id: { name } }).paths()[0]
        return vd ? unwrapObj((vd.value as any).init) : null
    }

    const isSamePrimitive = (node: any, v: any) => {
        if (!node) return false
        if (node.type === "Literal") return node.value === v
        if (node.type === "StringLiteral") return node.value === v
        if (node.type === "BooleanLiteral") return node.value === v
        if (node.type === "NumericLiteral") return node.value === v
        return false
    }

    /** Ensure objExpr[name] is an ObjectExpression:
     *  - create if missing
     *  - clear shorthand
     *  - if value is Identifier and resolves to object, return resolved
     *  - else wrap with `{ ...old }` to preserve data
     */
    function ensureContainer(objExpr: any, name: string): { node: any; changed: boolean } {
        let changed = false
        let prop = getProp(objExpr, name)

        if (!prop) {
            prop = j.property(
                "init",
                /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? j.identifier(name) : j.literal(name),
                j.objectExpression([]),
            )
            objExpr.properties.push(prop)
            return { node: prop.value, changed: true }
        }

        if ((prop as any).shorthand) {
            ;(prop as any).shorthand = false
            changed = true
        }

        if (isObj(prop.value)) return { node: prop.value, changed }

        if (prop.value?.type === "Identifier") {
            const resolved = resolveIdentToObj(prop.value.name)
            if (resolved) return { node: resolved, changed }
        }

        // replace with { ...old }
        prop.value = j.objectExpression([j.spreadElement(prop.value as any)])
        return { node: prop.value, changed: true }
    }

    function deepMerge(objExpr: any, patch: Record<string, any>): boolean {
        let changed = false

        for (const [k, v] of Object.entries(patch)) {
            const prop = getProp(objExpr, k)

            if (v && typeof v === "object" && !Array.isArray(v)) {
                const { node: container, changed: c } = ensureContainer(objExpr, k)
                if (c) changed = true
                if (deepMerge(container, v)) changed = true
                continue
            }

            if (!prop) {
                objExpr.properties.push(
                    j.property(
                        "init",
                        /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? j.identifier(k) : j.literal(k),
                        lit(v),
                    ),
                )
                changed = true
            } else if (!isSamePrimitive(prop.value, v)) {
                prop.value = lit(v)
                changed = true
            }
        }

        return changed
    }

    const targets: any[] = []

    // Handles [ESM] `export default cfg` or `export default { ... }`
    root.find(j.ExportDefaultDeclaration).forEach((p) => {
        const decl: any = (p.value as any).declaration
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
        const rhs: any = (p.value as any).right
        const obj = rhs.type === "Identifier" ? resolveIdentToObj(rhs.name) : unwrapObj(rhs)
        if (obj) targets.push(obj)
    })

    // Handles [TS CJS] `export = <expr>`
    root.find(j.TSExportAssignment).forEach((p) => {
        const rhs: any = (p.value as any).expression
        const obj = rhs.type === "Identifier" ? resolveIdentToObj(rhs.name) : unwrapObj(rhs)
        if (obj) targets.push(obj)
    })

    for (const cfgObj of targets) {
        deepMerge(cfgObj, patch)
    }
}
