import { describe, it, expect } from "vitest"

import {
    pluralize,
    extractCommands,
    extractImports,
    mapImports,
    orderSources,
    getVersionComponents,
    sha256,
} from "../src/utils.js"
import type { ResolcConfig } from "../src/types.js"

describe("pluralize", () => {
    it("returns singular when n is 1", () => {
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

    it("adds --debug-output-dir when set", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { debugOutputDir: "/tmp/debug" },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("--debug-output-dir=/tmp/debug")
    })

    it("adds -g flag when emitDourceDebugInfo is set", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { emitDourceDebugInfo: true },
        }
        const commands = extractCommands(config)
        expect(commands).toContain("-g")
    })

    it("throws when allowPaths set without basePath", () => {
        const config: ResolcConfig = {
            version: "0.6.0",
            compilerSource: "binary",
            settings: { allowPaths: "/lib" },
        }
        expect(() => extractCommands(config)).toThrow("--allow-paths option is only available")
    })
})

describe("extractImports", () => {
    it("extracts double-quoted imports", () => {
        const code = 'import "foo/bar.sol";'
        expect(extractImports(code)).toEqual(["foo/bar.sol"])
    })

    it("extracts single-quoted imports", () => {
        const code = "import 'foo/bar.sol';"
        expect(extractImports(code)).toEqual(["foo/bar.sol"])
    })

    it("extracts from-style imports", () => {
        const code = 'import { Foo } from "foo/bar.sol";'
        expect(extractImports(code)).toEqual(["foo/bar.sol"])
    })

    it("handles multiple imports", () => {
        const code = 'import "a.sol";\nimport "b.sol";'
        expect(extractImports(code)).toEqual(["a.sol", "b.sol"])
    })

    it("returns empty array when no imports", () => {
        expect(extractImports("contract Foo {}")).toEqual([])
    })
})

describe("mapImports", () => {
    it("maps source names to their imports", () => {
        const input = {
            language: "Solidity",
            sources: {
                "A.sol": { content: 'import "B.sol";' },
                "B.sol": { content: "" },
            },
            settings: {},
        }
        const result = mapImports(input)
        expect(result.get("A.sol")).toEqual(["B.sol"])
        expect(result.get("B.sol")).toEqual([])
    })
})

describe("orderSources", () => {
    it("orders sources by dependency", () => {
        const map = new Map<string, string[]>()
        map.set("A.sol", ["B.sol"])
        map.set("B.sol", [])
        const ordered = orderSources(map)
        expect(ordered.indexOf("B.sol")).toBeLessThan(ordered.indexOf("A.sol"))
    })

    it("handles sources with no dependencies", () => {
        const map = new Map<string, string[]>()
        map.set("A.sol", [])
        map.set("B.sol", [])
        const ordered = orderSources(map)
        expect(ordered).toHaveLength(2)
    })
})

describe("sha256", () => {
    it("produces a 64-char hex hash", () => {
        const hash = sha256(new Uint8Array([1, 2, 3]))
        expect(hash).toHaveLength(64)
        expect(hash).toMatch(/^[0-9a-f]+$/)
    })

    it("produces consistent results", () => {
        const data = new Uint8Array([42])
        expect(sha256(data)).toBe(sha256(data))
    })
})
