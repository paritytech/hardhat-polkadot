import Module from "module";
import path from "path";


function needsPatch() {
    return (process.argv.includes('ignition') && process.argv.includes('deploy')) || process.argv.includes('test');
}

export function sizeCheckPatch() {
    if (!needsPatch()) {
        return;
    }
    const originalLoad = (Module as any)._load;
    let patched = false;

    (Module as any)._load = function (request: string, parent: Module, isMain: boolean) {
        if (patched) return originalLoad(request, parent, isMain);

        const loaded = originalLoad(request, parent, isMain);

        if (request === "@nomicfoundation/ethereumjs-tx") {
            try {
                const utilPath = path.join(
                    path.dirname(require.resolve("@nomicfoundation/ethereumjs-tx", { paths: [process.cwd()] })),
                    "util.js"
                );
                const util = require(utilPath);

                if (typeof util.checkMaxInitCodeSize === "function") {
                    util.checkMaxInitCodeSize = function () { };
                    patched = true;
                } else {
                    console.warn("checkMaxInitCodeSize not found in dist/util.js");
                }
            } catch (err) {
                console.error("Failed to patch checkMaxInitCodeSize:", err);
            }
        }

        return loaded;
    };

    process.on('exit', () => {
        (Module as any)._load = originalLoad;
    });

    process.on('SIGINT', () => {
        (Module as any)._load = originalLoad;
        process.exit();
    });
}