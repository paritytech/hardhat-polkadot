import { describe, it, expect, vi } from "vitest"

import {
    pluralize,
    extractCommands,
    extractImports,
    mapImports,
    orderSources,
    getVersionComponents,
    sha256,
    updateDefaultCompilerConfig,
} from "../src/utils"
import type { ResolcConfig, SolcConfigData } from "../src/types"

describe("pluralize", () => {
    it('returns singular when n is 1', () => {
        expect(pluralize(1, "file")).toBe("file")
    })

    it('returns plural with "s" suffix when n > 1', () => {
        expect(pluralize(2, "file")).toBe("files")
    })

    it('returns plural with "s" suffix when n is 0', () => {
        expect(pluralize(0, "file")).toBe("files")
    })

    it("uses custom plural when provided", () => {
        expect(pluralize(2, "index", "indices")).toBe("indices")
    })

    it("uses custom plural for 0", () => {
        expect(pluralize(0, "index", "indices")).toBe("indices")
    })
})

describe("getVersionComponents", () => {
    it("splits a semver string into components", () => {
        expect(getVersionComponents("0.8.28")).toEqual([0, 8, 28])
    })

    it("handles single digit versions", () => {
        expect(getVersionComponents("1.0.0")).toEqual([1, 0, 0])
    })

    it("handles large version numbers", () => {
        expect(getVersionComponents("10.20.300")).toEqual([10, 20, 300])
    })
})

describe("extractCommands", () => {
    it("returns --standard-json by default", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {},
        }
        const commands = extractCommands(config)
        expect(commands).toContain("--standard-json")
    })

    it("adds --solc flag when solcPath is set", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { solcPath: "/path/to/solc" },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("--solc=/path/to/solc")
    })

    it("adds --base-path flag when basePath is set", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { basePath: "/src" },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("--base-path=/src")
    })

    it("adds --include-paths flag when includePaths is set", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { includePaths: ["/lib", "/node_modules"] },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("--include-paths=/lib,/node_modules")
    })

    it("adds --allow-paths flag when both basePath and allowPaths are set", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { basePath: "/src", allowPaths: "/lib" },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("--allow-paths=/lib")
    })

    it("throws when allowPaths is set without basePath", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { allowPaths: "/lib" },
        }
        expect(() => extractCommands(config)).toThrow(
            "--allow-paths option is only available when --base-path has a non-empty value.",
        )
    })

    it("adds --debug-output-dir when debugOutputDir is set", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { debugOutputDir: "/debug" },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("--debug-output-dir=/debug")
    })

    it("adds -g flag when emitDourceDebugInfo is true", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { emitDourceDebugInfo: true },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("-g")
    })

    it("does not add -g flag when emitDourceDebugInfo is false", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { emitDourceDebugInfo: false },
        }
        const commands = extractCommands(config)
        expect(commands).not.toContain("-g")
    })
})

describe("extractImports", () => {
    it("extracts double-quoted import", () => {
        const content = 'import "foo/bar.sol";'
        expect(extractImports(content)).toEqual(["foo/bar.sol"])
    })

    it("extracts single-quoted import", () => {
        const content = "import 'foo/bar.sol';"
        expect(extractImports(content)).toEqual(["foo/bar.sol"])
    })

    it("extracts named import with from", () => {
        const content = 'import { Something } from "foo/bar.sol";'
        expect(extractImports(content)).toEqual(["foo/bar.sol"])
    })

    it("extracts wildcard import with from", () => {
        const content = 'import * as Foo from "foo/bar.sol";'
        expect(extractImports(content)).toEqual(["foo/bar.sol"])
    })

    it("extracts multiple imports", () => {
        const content = [
            'import "a.sol";',
            "import 'b.sol';",
            'import { X } from "c.sol";',
        ].join("\n")
        expect(extractImports(content)).toEqual(["a.sol", "b.sol", "c.sol"])
    })

    it("returns empty array for no imports", () => {
        const content = "contract Foo {}"
        expect(extractImports(content)).toEqual([])
    })

    it("handles OpenZeppelin-style imports", () => {
        const content = 'import "@openzeppelin/contracts/token/ERC20/ERC20.sol";'
        expect(extractImports(content)).toEqual([
            "@openzeppelin/contracts/token/ERC20/ERC20.sol",
        ])
    })
})

describe("mapImports", () => {
    it("maps source names to their imports", () => {
        const input = {
            language: "Solidity",
            sources: {
                "A.sol": { content: 'import "B.sol";' },
                "B.sol": { content: "contract B {}" },
            },
            settings: { outputSelection: {} },
        }
        const result = mapImports(input)
        expect(result.get("A.sol")).toEqual(["B.sol"])
        expect(result.get("B.sol")).toEqual([])
    })

    it("handles empty sources", () => {
        const input = {
            language: "Solidity",
            sources: {},
            settings: { outputSelection: {} },
        }
        const result = mapImports(input)
        expect(result.size).toBe(0)
    })
})

describe("orderSources", () => {
    it("places dependencies before their dependents in iteration order", () => {
        const mapped = new Map<string, string[]>()
        mapped.set("A.sol", ["B.sol", "C.sol"])
        mapped.set("B.sol", ["C.sol"])
        mapped.set("C.sol", [])

        const ordered = orderSources(mapped)
        // A.sol depends on B.sol and C.sol, so they appear before A.sol
        expect(ordered.indexOf("B.sol")).toBeLessThan(ordered.indexOf("A.sol"))
        expect(ordered.indexOf("C.sol")).toBeLessThan(ordered.indexOf("A.sol"))
        // All three should be present exactly once
        expect(ordered).toHaveLength(3)
    })

    it("handles no dependencies", () => {
        const mapped = new Map<string, string[]>()
        mapped.set("A.sol", [])
        mapped.set("B.sol", [])

        const ordered = orderSources(mapped)
        expect(ordered).toEqual(["A.sol", "B.sol"])
    })

    it("handles single source", () => {
        const mapped = new Map<string, string[]>()
        mapped.set("A.sol", [])

        expect(orderSources(mapped)).toEqual(["A.sol"])
    })

    it("handles empty map", () => {
        const mapped = new Map<string, string[]>()
        expect(orderSources(mapped)).toEqual([])
    })

    it("deduplicates dependencies", () => {
        const mapped = new Map<string, string[]>()
        mapped.set("A.sol", ["C.sol"])
        mapped.set("B.sol", ["C.sol"])
        mapped.set("C.sol", [])

        const ordered = orderSources(mapped)
        const cCount = ordered.filter((s) => s === "C.sol").length
        expect(cCount).toBe(1)
    })
})

describe("sha256", () => {
    it("produces a valid hex hash", () => {
        const data = new Uint8Array([1, 2, 3, 4])
        const hash = sha256(data)
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it("produces consistent results", () => {
        const data = new Uint8Array([1, 2, 3, 4])
        expect(sha256(data)).toBe(sha256(data))
    })

    it("produces different hashes for different input", () => {
        const a = new Uint8Array([1, 2, 3])
        const b = new Uint8Array([4, 5, 6])
        expect(sha256(a)).not.toBe(sha256(b))
    })
})

describe("updateDefaultCompilerConfig", () => {
    function makeSolcConfigData(version = "0.8.28"): SolcConfigData {
        return {
            compiler: {
                version,
                settings: {},
            },
        }
    }

    it("sets output selection with required fields", () => {
        const data = makeSolcConfigData()
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { optimizer: { enabled: true, runs: 200 } },
        }
        updateDefaultCompilerConfig(data, resolc)

        const outputSelection = data.compiler.settings.outputSelection
        expect(outputSelection["*"]["*"]).toContain("abi")
        expect(outputSelection["*"]["*"]).toContain("evm.bytecode")
        expect(outputSelection["*"]["*"]).toContain("evm.deployedBytecode")
    })

    it("applies optimizer when enabled", () => {
        const data = makeSolcConfigData()
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { optimizer: { enabled: true, runs: 200 } },
        }
        updateDefaultCompilerConfig(data, resolc)

        expect(data.compiler.settings.optimizer.enabled).toBe(true)
        expect(data.compiler.settings.optimizer.runs).toBe(200)
    })

    it("disables optimizer when explicitly disabled", () => {
        const data = makeSolcConfigData()
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { optimizer: { enabled: false } },
        }
        updateDefaultCompilerConfig(data, resolc)

        expect(data.compiler.settings.optimizer.enabled).toBe(false)
        expect(data.compiler.settings.optimizer.runs).toBe(200)
    })

    it("defaults optimizer to disabled when no optimizer settings", () => {
        const data = makeSolcConfigData()
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {},
        }
        updateDefaultCompilerConfig(data, resolc)

        expect(data.compiler.settings.optimizer.enabled).toBe(false)
    })

    it("throws for solidity versions below 0.7.0", () => {
        const data = makeSolcConfigData("0.6.12")
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {},
        }

        expect(() => updateDefaultCompilerConfig(data, resolc)).toThrow(
            "Solidity versions below 0.8.0 are not supported",
        )
    })

    it("does not throw for solidity 0.8.x", () => {
        const data = makeSolcConfigData("0.8.0")
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {},
        }

        expect(() => updateDefaultCompilerConfig(data, resolc)).not.toThrow()
    })

    it("does not throw for solidity 1.x", () => {
        const data = makeSolcConfigData("1.0.0")
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {},
        }

        expect(() => updateDefaultCompilerConfig(data, resolc)).not.toThrow()
    })

    it("embeds resolc config in compiler settings", () => {
        const data = makeSolcConfigData()
        const resolc: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: {},
        }
        updateDefaultCompilerConfig(data, resolc)

        expect(data.compiler.settings.resolc).toBe(resolc)
    })
})
