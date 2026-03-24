import type { ConfigHooks, HardhatUserConfigValidationError } from "hardhat/types/hooks"

const configHookHandler: () => Promise<Partial<ConfigHooks>> = async () => ({
    extendUserConfig: async (config, next) => {
        const networks = config.networks ?? {}

        // Ensure polkadot-enabled networks have the correct type for v3 validation.
        // In v3, the default EDR network is "default" (not "hardhat"). If users
        // define a "hardhat" network with polkadot config, we need to ensure it
        // has a `type` field so the Zod discriminated union validates correctly.
        for (const [, network] of Object.entries(networks)) {
            if (!network || !("polkadot" in network) || !network.polkadot) continue
            if (!("type" in network) || network.type === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;(network as any).type = "url" in network ? "http" : "edr-simulated"
            }
        }

        return next({ ...config, networks })
    },

    validateUserConfig: async (config) => {
        const errors: HardhatUserConfigValidationError[] = []
        const networks = config.networks ?? {}

        for (const [name, network] of Object.entries(networks)) {
            if (!network || !("polkadot" in network) || !network.polkadot) continue

            const polkadot = network.polkadot
            if (typeof polkadot !== "boolean" && typeof polkadot !== "object") {
                errors.push({
                    path: ["networks", name, "polkadot"],
                    message: `Expected a boolean or { target: "evm" | "pvm" }.`,
                })
            }

            if ("nodeConfig" in network && network.nodeConfig) {
                const nc = network.nodeConfig
                if (nc.rpcPort !== undefined && typeof nc.rpcPort !== "number") {
                    errors.push({
                        path: ["networks", name, "nodeConfig", "rpcPort"],
                        message: "Expected a number.",
                    })
                }
            }

            if ("adapterConfig" in network && network.adapterConfig) {
                const ac = network.adapterConfig
                if (ac.adapterPort !== undefined && typeof ac.adapterPort !== "number") {
                    errors.push({
                        path: ["networks", name, "adapterConfig", "adapterPort"],
                        message: "Expected a number.",
                    })
                }

                if ("nodeConfig" in network && network.nodeConfig) {
                    if (
                        ac.adapterPort !== undefined &&
                        ac.adapterPort === network.nodeConfig.rpcPort
                    ) {
                        errors.push({
                            path: ["networks", name, "adapterConfig", "adapterPort"],
                            message: "Adapter and node cannot share the same port.",
                        })
                    }
                }
            }
        }

        return errors
    },
})

export default configHookHandler
