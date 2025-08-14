// hardhat-patch-generic.ts
import type { API, FileInfo, Transform } from "jscodeshift"
import fs from "fs"

// Default patch (override via options.patch)
const DEFAULT_PATCH = {
    networks: {
        hardhat: {
            polkavm: true,
            nodeConfig: {
                nodeBinaryPath: "./bin/substrate-node",
                rpcPort: 8000,
                dev: true,
            },
            adapterConfig: {
                adapterBinaryPath: "./bin/eth-rpc",
                dev: true,
            },
            localNode: {
                polkavm: true,
                url: `http://127.0.0.1:8545`,
            },
        },
    },
} as const

const t: Transform = (file: FileInfo, api: API, options: any) => {
    const j = api.jscodeshift
    const root = j(file.source)
    const PATCH = options?.patch ? JSON.parse(String(options.patch)) : DEFAULT_PATCH

    // --- utils ---
    const isObj = (n: any) => n && n.type === "ObjectExpression"

    const lit = (v: any): any => {
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

    const getProp = (obj: any, name: string) =>
        obj.properties.find((p: any) => {
            if (p.type !== "Property" && p.type !== "ObjectProperty") return false
            const k = p.key
            return (
                (k.type === "Identifier" && k.name === name) ||
                ((k.type === "StringLiteral" || k.type === "Literal") && k.value === name)
            )
        })

    const unwrapObjInit = (node: any): any => {
        let n = node
        for (;;) {
            if (!n) break
            if (isObj(n)) break
            if (
                n.type === "TSAsExpression" ||
                n.type === "TSTypeAssertion" ||
                n.type === "TSNonNullExpression" ||
                n.type === "ParenthesizedExpression"
            ) {
                n = n.expression || n.operand || n.expression
                continue
            }
            break
        }
        return isObj(n) ? n : null
    }

    const resolveIdentToObj = (name: string): any => {
        const vd = root.find(j.VariableDeclarator, { id: { type: "Identifier", name } }).paths()[0]
        return vd ? unwrapObjInit(vd.value.init) : null
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

    /** Deep-merge plain object `patch` into ObjectExpression `objExpr`. */
    function deepMergeObjExpr(objExpr: any, patch: Record<string, any>): boolean {
        let changed = false

        for (const [k, v] of Object.entries(patch)) {
            const prop = getProp(objExpr, k)

            if (v && typeof v === "object" && !Array.isArray(v)) {
                const { node: container, changed: c } = ensureContainer(objExpr, k)
                if (c) changed = true
                if (deepMergeObjExpr(container, v)) changed = true
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

    // ---- locate exported config object(s) ----
    const targets: any[] = []

    root.find(j.ExportDefaultDeclaration, { declaration: { type: "ObjectExpression" } }).forEach(
        (p) => targets.push(p.value.declaration),
    )

    root.find(j.ExportDefaultDeclaration, { declaration: { type: "Identifier" } }).forEach((p) => {
        const name = (p.value.declaration as any).name
        const vd = root.find(j.VariableDeclarator, { id: { name } }).paths()[0]
        const obj = vd && unwrapObjInit(vd.value.init)
        if (obj) targets.push(obj)
    })

    root.find(j.AssignmentExpression, {
        operator: "=",
        left: {
            type: "MemberExpression",
            object: { name: "module" },
            property: { name: "exports" },
        },
        right: { type: "ObjectExpression" },
    }).forEach((p) => targets.push((p.value as any).right))

    root.find(j.AssignmentExpression, {
        operator: "=",
        left: {
            type: "MemberExpression",
            object: { name: "module" },
            property: { name: "exports" },
        },
        right: { type: "Identifier" },
    }).forEach((p) => {
        const name = (p.value.right as any).name
        const vd = root.find(j.VariableDeclarator, { id: { name } }).paths()[0]
        const obj = vd && unwrapObjInit(vd.value.init)
        if (obj) targets.push(obj)
    })

    root.find(j.TSExportAssignment, { expression: { type: "Identifier" } }).forEach((p) => {
        const name = (p.value.expression as any).name
        const vd = root.find(j.VariableDeclarator, { id: { name } }).paths()[0]
        const obj = vd && unwrapObjInit(vd.value.init)
        if (obj) targets.push(obj)
    })

    if (targets.length === 0) return null

    // ---- apply PATCH at arbitrary depth ----
    let mutated = false
    for (const cfgObj of targets) {
        if (deepMergeObjExpr(cfgObj, PATCH)) mutated = true
    }

    fs.writeFileSync(file.path, root.toSource(), "utf8")
}

export default t
