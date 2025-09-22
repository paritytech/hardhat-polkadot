import Module from "module"
import path from "path"
import WebSocket from "ws"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(global as any).WebSocket) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(global as any).WebSocket = WebSocket
}

function needsPatch() {
    return (
        (process.argv.includes("ignition") && process.argv.includes("deploy")) ||
        process.argv.includes("test") ||
        process.argv.includes("run")
    )
}

export function sizeCheckPatch() {
    if (!needsPatch()) {
        return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalLoad = (Module as any)._load
    let patched = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(Module as any)._load = function (request: string, parent: Module, isMain: boolean) {
        if (patched) return originalLoad(request, parent, isMain)

        const loaded = originalLoad(request, parent, isMain)

        if (request === "@nomicfoundation/ethereumjs-tx") {
            try {
                const utilPath = path.join(
                    path.dirname(
                        require.resolve("@nomicfoundation/ethereumjs-tx", {
                            paths: [process.cwd()],
                        }),
                    ),
                    "util.js",
                )
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const util = require(utilPath)

                if (typeof util.checkMaxInitCodeSize === "function") {
                    util.checkMaxInitCodeSize = function () {}
                    patched = true
                } else {
                    console.warn("checkMaxInitCodeSize not found in dist/util.js")
                }
            } catch (err) {
                console.error("Failed to patch checkMaxInitCodeSize:", err)
            }
        }

        // fallback: normal require
        return loaded
    }

    process.on("exit", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(Module as any)._load = originalLoad
    })

    process.on("SIGINT", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(Module as any)._load = originalLoad
        process.exit()
    })
}
