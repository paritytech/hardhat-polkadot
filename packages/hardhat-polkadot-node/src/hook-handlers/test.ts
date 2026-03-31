import type { HookContext } from "hardhat/types/hooks"
import path from "path"

import { DEFAULT_NETWORK_NAME } from "../constants.js"

// TestHooks is augmented onto HardhatHooks by the test builtin plugin.
// Not re-exported from a public path; duplicated here. Keep in sync with
// hardhat/src/internal/builtin-plugins/test/type-extensions/hooks.ts
interface TestHooks {
    registerFileForTestRunner: (
        context: HookContext,
        filePath: string,
        next: (nextContext: HookContext, filePath: string) => Promise<string | undefined>,
    ) => Promise<string | undefined>
}

const testHookHandler: () => Promise<Partial<TestHooks>> = async () => ({
    registerFileForTestRunner: async (context, filePath, next) => {
        // Only claim files when a polkadot network is configured
        const networkConfig = context.config.networks?.[DEFAULT_NETWORK_NAME]
        const isPolkadot = networkConfig && "polkadot" in networkConfig && !!networkConfig.polkadot

        if (!isPolkadot) {
            return next(context, filePath)
        }

        // Claim .sol test files for the polkadot solidity runner
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const testDir = (context.config.paths as any).tests?.solidity
            ?? path.join(context.config.paths.root, "test")
        const absoluteFilePath = path.resolve(context.config.paths.root, filePath)

        if (
            filePath.endsWith(".sol") &&
            (filePath.endsWith(".t.sol") || absoluteFilePath.startsWith(testDir))
        ) {
            return "solidity"
        }

        return next(context, filePath)
    },
})

export default testHookHandler
