import type { ConfigHooks, HardhatUserConfigValidationError } from "hardhat/types/hooks"

const configHookHandler: () => Promise<Partial<ConfigHooks>> = async () => ({
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
