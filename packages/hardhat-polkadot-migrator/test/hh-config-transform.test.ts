import { describe, it, expect } from "vitest"
import jscodeshiftFactory from "jscodeshift"

import {
    insertImport,
    patchExportConfig,
    addPluginsArray,
    wrapWithDefineConfig,
    renameHardhatNetwork,
    updateDefaultNetworkProperty,
} from "../src/hh-config-transform.js"

const j = jscodeshiftFactory.withParser("tsx")

function transform(source: string) {
    const root = j(source)
    return root
}

describe("insertImport", () => {
    it("inserts ESM default import", () => {
        const root = transform('import foo from "foo"\nexport default {}')
        insertImport(root, j, "@parity/hardhat-polkadot")
        const output = root.toSource()
        expect(output).toContain('import polkadot from "@parity/hardhat-polkadot"')
    })

    it("inserts CJS require", () => {
        const root = transform('module.exports = {}')
        insertImport(root, j, "@parity/hardhat-polkadot")
        const output = root.toSource()
        expect(output).toContain('const polkadot = require("@parity/hardhat-polkadot")')
    })

    it("does not duplicate ESM import", () => {
        const root = transform(
            'import polkadot from "@parity/hardhat-polkadot"\nexport default {}',
        )
        insertImport(root, j, "@parity/hardhat-polkadot")
        const output = root.toSource()
        const count = (output.match(/@parity\/hardhat-polkadot/g) || []).length
        expect(count).toBe(1)
    })

    it("does not duplicate CJS require", () => {
        const root = transform(
            'const polkadot = require("@parity/hardhat-polkadot")\nmodule.exports = {}',
        )
        insertImport(root, j, "@parity/hardhat-polkadot")
        const output = root.toSource()
        const count = (output.match(/@parity\/hardhat-polkadot/g) || []).length
        expect(count).toBe(1)
    })
})

describe("patchExportConfig", () => {
    it("merges patch into ESM default export", () => {
        const root = transform('export default { solidity: "0.8.28" }')
        patchExportConfig(root, j, { networks: { hardhat: { polkadot: true } } })
        const output = root.toSource()
        expect(output).toContain("polkadot: true")
        expect(output).toContain("networks")
    })

    it("merges patch into CJS module.exports", () => {
        const root = transform('module.exports = { solidity: "0.8.28" }')
        patchExportConfig(root, j, { networks: { hardhat: { polkadot: true } } })
        const output = root.toSource()
        expect(output).toContain("polkadot: true")
    })

    it("merges into variable reference export", () => {
        const root = transform('const config = { solidity: "0.8.28" }\nexport default config')
        patchExportConfig(root, j, { foo: "bar" })
        const output = root.toSource()
        expect(output).toContain('foo: "bar"')
    })

    it("merges into defineConfig wrapper", () => {
        const root = transform('export default defineConfig({ solidity: "0.8.28" })')
        patchExportConfig(root, j, { foo: "bar" })
        const output = root.toSource()
        expect(output).toContain('foo: "bar"')
    })

    it("does not overwrite existing same-value properties", () => {
        const root = transform('export default { solidity: "0.8.28" }')
        patchExportConfig(root, j, { solidity: "0.8.28" })
        const output = root.toSource()
        const count = (output.match(/solidity/g) || []).length
        expect(count).toBe(1)
    })
})

describe("addPluginsArray", () => {
    it("adds plugins property to ESM export", () => {
        const root = transform('export default { solidity: "0.8.28" }')
        addPluginsArray(root, j, "polkadot")
        const output = root.toSource()
        expect(output).toContain("plugins: [polkadot]")
    })

    it("adds plugins property to CJS export", () => {
        const root = transform('module.exports = { solidity: "0.8.28" }')
        addPluginsArray(root, j, "polkadot")
        const output = root.toSource()
        expect(output).toContain("plugins: [polkadot]")
    })

    it("does not duplicate plugins if already present", () => {
        const root = transform('export default { plugins: [foo], solidity: "0.8.28" }')
        addPluginsArray(root, j, "polkadot")
        const output = root.toSource()
        const count = (output.match(/plugins/g) || []).length
        expect(count).toBe(1)
    })

    it("inserts plugins as first property", () => {
        const root = transform('export default { solidity: "0.8.28" }')
        addPluginsArray(root, j, "polkadot")
        const output = root.toSource()
        const pluginsIdx = output.indexOf("plugins")
        const solidityIdx = output.indexOf("solidity")
        expect(pluginsIdx).toBeLessThan(solidityIdx)
    })
})

describe("wrapWithDefineConfig", () => {
    it("wraps ESM export default in defineConfig", () => {
        const root = transform('export default { solidity: "0.8.28" }')
        wrapWithDefineConfig(root, j)
        const output = root.toSource()
        expect(output).toContain("defineConfig({")
    })

    it("adds defineConfig import for ESM", () => {
        const root = transform('import foo from "foo"\nexport default { solidity: "0.8.28" }')
        wrapWithDefineConfig(root, j)
        const output = root.toSource()
        expect(output).toContain('import { defineConfig } from "hardhat/config"')
    })

    it("does not double-wrap defineConfig", () => {
        const root = transform('export default defineConfig({ solidity: "0.8.28" })')
        wrapWithDefineConfig(root, j)
        const output = root.toSource()
        // Should still have exactly one defineConfig() call wrapping the config
        expect(output).not.toContain("defineConfig(defineConfig(")
    })

    it("wraps CJS module.exports in defineConfig", () => {
        const root = transform('module.exports = { solidity: "0.8.28" }')
        wrapWithDefineConfig(root, j)
        const output = root.toSource()
        expect(output).toContain("defineConfig({")
    })

    it("adds require for CJS", () => {
        const root = transform('module.exports = { solidity: "0.8.28" }')
        wrapWithDefineConfig(root, j)
        const output = root.toSource()
        expect(output).toContain('require("hardhat/config")')
        expect(output).toContain("defineConfig")
    })

    it("extends existing hardhat/config import", () => {
        const root = transform(
            'import { HardhatUserConfig } from "hardhat/config"\nexport default {}',
        )
        wrapWithDefineConfig(root, j)
        const output = root.toSource()
        expect(output).toContain("defineConfig")
        // should be added to existing import, not a new one
        const importCount = (output.match(/from "hardhat\/config"/g) || []).length
        expect(importCount).toBe(1)
    })
})

describe("renameHardhatNetwork", () => {
    it("renames hardhat network key to default in ESM export", () => {
        const root = transform('export default { networks: { hardhat: { chainId: 31337 } } }')
        renameHardhatNetwork(root, j)
        const output = root.toSource()
        expect(output).toContain("default:")
        expect(output).not.toContain("hardhat:")
    })

    it("renames hardhat network key in CJS export", () => {
        const root = transform('module.exports = { networks: { hardhat: { chainId: 31337 } } }')
        renameHardhatNetwork(root, j)
        const output = root.toSource()
        expect(output).toContain("default:")
        expect(output).not.toContain("hardhat:")
    })

    it("does nothing when no hardhat network exists", () => {
        const root = transform('export default { networks: { sepolia: {} } }')
        renameHardhatNetwork(root, j)
        const output = root.toSource()
        expect(output).toContain("sepolia")
        // "default" only appears in "export default", not as a network key
        expect(output).not.toMatch(/networks:.*default:/)
    })

    it("does nothing when default network already exists", () => {
        const root = transform(
            'export default { networks: { hardhat: { a: 1 }, default: { b: 2 } } }',
        )
        renameHardhatNetwork(root, j)
        const output = root.toSource()
        // Both should still be present — no rename when default already exists
        expect(output).toContain("hardhat")
        expect(output).toContain("default")
    })

    it("renames string-literal hardhat key", () => {
        const root = transform('export default { networks: { "hardhat": { chainId: 31337 } } }')
        renameHardhatNetwork(root, j)
        const output = root.toSource()
        expect(output).toContain("default")
        expect(output).not.toMatch(/"hardhat"/)
    })

    it("does nothing when no networks property exists", () => {
        const source = 'export default { solidity: "0.8.28" }'
        const root = transform(source)
        renameHardhatNetwork(root, j)
        expect(root.toSource()).toBe(source)
    })
})

describe("updateDefaultNetworkProperty", () => {
    it("updates defaultNetwork from hardhat to default", () => {
        const root = transform('export default { defaultNetwork: "hardhat" }')
        updateDefaultNetworkProperty(root, j)
        const output = root.toSource()
        expect(output).toContain('defaultNetwork: "default"')
        expect(output).not.toContain('"hardhat"')
    })

    it("does not change other defaultNetwork values", () => {
        const root = transform('export default { defaultNetwork: "sepolia" }')
        updateDefaultNetworkProperty(root, j)
        const output = root.toSource()
        expect(output).toContain('defaultNetwork: "sepolia"')
    })

    it("does nothing when no defaultNetwork exists", () => {
        const source = 'export default { solidity: "0.8.28" }'
        const root = transform(source)
        updateDefaultNetworkProperty(root, j)
        expect(root.toSource()).toBe(source)
    })

    it("updates CJS config", () => {
        const root = transform('module.exports = { defaultNetwork: "hardhat" }')
        updateDefaultNetworkProperty(root, j)
        const output = root.toSource()
        expect(output).toContain('defaultNetwork: "default"')
    })
})

describe("full transform pipeline", () => {
    it("transforms v2 ESM config to v3", () => {
        const source = `import { HardhatUserConfig } from "hardhat/config"
import "@parity/hardhat-polkadot"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
}

export default config`

        const root = j(source)
        insertImport(root, j, "@parity/hardhat-polkadot")
        patchExportConfig(root, j, { networks: { hardhat: { polkadot: true } } })
        addPluginsArray(root, j, "polkadot")
        wrapWithDefineConfig(root, j)
        const output = root.toSource()

        expect(output).toContain("plugins: [polkadot]")
        expect(output).toContain("polkadot: true")
        expect(output).toContain("defineConfig")
    })

    it("transforms v2 CJS config to v3", () => {
        const source = `require("@parity/hardhat-polkadot")

module.exports = {
    solidity: "0.8.28",
}`

        const root = j(source)
        insertImport(root, j, "@parity/hardhat-polkadot")
        patchExportConfig(root, j, { networks: { hardhat: { polkadot: true } } })
        addPluginsArray(root, j, "polkadot")
        wrapWithDefineConfig(root, j)
        const output = root.toSource()

        expect(output).toContain("plugins: [polkadot]")
        expect(output).toContain("polkadot: true")
        expect(output).toContain("defineConfig")
    })

    it("migrates v2 config with hardhat network and defaultNetwork to v3", () => {
        const source = `import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
        sepolia: {
            url: "https://sepolia.example.com",
        },
    },
}

export default config`

        const root = j(source)
        renameHardhatNetwork(root, j)
        updateDefaultNetworkProperty(root, j)
        insertImport(root, j, "@parity/hardhat-polkadot")
        patchExportConfig(root, j, {
            networks: { default: { polkadot: true, nodeConfig: { nodeBinaryPath: "./bin/anvil-polkadot" } } },
        })
        addPluginsArray(root, j, "polkadot")
        wrapWithDefineConfig(root, j)
        const output = root.toSource()

        // hardhat network renamed to default
        expect(output).not.toMatch(/networks:.*hardhat:/)
        expect(output).toContain("default:")
        // defaultNetwork updated
        expect(output).toContain('defaultNetwork: "default"')
        // polkadot config merged into the renamed default network
        expect(output).toContain("polkadot: true")
        expect(output).toContain("nodeBinaryPath")
        // sepolia still present
        expect(output).toContain("sepolia")
        // plugins and defineConfig added
        expect(output).toContain("plugins: [polkadot]")
        expect(output).toContain("defineConfig")
    })

    it("migrates v2 CJS config with hardhat network to v3", () => {
        const source = `require("@nomicfoundation/hardhat-toolbox")

module.exports = {
    solidity: "0.8.28",
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
        },
    },
}`

        const root = j(source)
        renameHardhatNetwork(root, j)
        updateDefaultNetworkProperty(root, j)
        insertImport(root, j, "@parity/hardhat-polkadot")
        patchExportConfig(root, j, {
            networks: { default: { polkadot: true } },
        })
        addPluginsArray(root, j, "polkadot")
        wrapWithDefineConfig(root, j)
        const output = root.toSource()

        expect(output).toContain('defaultNetwork: "default"')
        expect(output).toContain("polkadot: true")
        expect(output).toContain("defineConfig")
        expect(output).not.toMatch(/networks[\s\S]*hardhat:/)
    })
})
