import type { HardhatRuntimeEnvironmentHooks } from "hardhat/types/hooks"

import { ResolcPluginError } from "../errors.js"

const hreHookHandler: () => Promise<Partial<HardhatRuntimeEnvironmentHooks>> = async () => ({
    created: async (_context, hre) => {
        const resolc = hre.config.resolc
        if (!resolc) return

        if (resolc.compilerSource !== "npm") return

        // Validate: npm compiler source doesn't support multiple solidity versions
        for (const profile of Object.values(hre.config.solidity.profiles)) {
            if (profile.compilers.length > 1 || Object.keys(profile.overrides).length > 0) {
                throw new ResolcPluginError(
                    `Multiple solidity versions are not available when using npm as the compiler.`,
                )
            }
        }
    },
})

export default hreHookHandler
