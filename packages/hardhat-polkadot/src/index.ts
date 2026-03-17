import type { HardhatPlugin } from "hardhat/types/plugins"

import { sizeCheckPatch } from "./sizeCheckPatch.js"
sizeCheckPatch()

const hardhatPolkadotPlugin: HardhatPlugin = {
    id: "hardhat-polkadot",
    npmPackage: "@parity/hardhat-polkadot",
    dependencies: () => [
        import("@parity/hardhat-polkadot-resolc") as unknown as Promise<{ default: HardhatPlugin }>,
        import("@parity/hardhat-polkadot-node") as unknown as Promise<{ default: HardhatPlugin }>,
    ],
    hookHandlers: {},
    tasks: [],
}

export default hardhatPolkadotPlugin
