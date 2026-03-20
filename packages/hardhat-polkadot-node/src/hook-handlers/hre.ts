import type { HardhatRuntimeEnvironmentHooks } from "hardhat/types/hooks"

const hreHookHandler: () => Promise<Partial<HardhatRuntimeEnvironmentHooks>> = async () => ({
    created: async (_context, _hre) => {
        // In v3, network setup is deferred to network hooks (newConnection).
        // No HRE-level setup needed for the node package.
    },
})

export default hreHookHandler
