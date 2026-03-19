import type { ConfigHooks, HardhatUserConfigValidationError } from "hardhat/types/hooks"
import type { HardhatUserConfig } from "hardhat/types/config"

import { defaultNpmResolcConfig, defaultBinaryResolcConfig } from "../constants.js"
import type { ResolcConfig } from "../types.js"

function hasPolkadotNetwork(config: HardhatUserConfig): boolean {
    const networks = config.networks ?? {}
    return Object.values(networks).some(
        (network) => network && "polkadot" in network && !!network.polkadot,
    )
}

function isTargetingEvm(config: HardhatUserConfig): boolean {
    const networks = config.networks ?? {}
    return Object.values(networks).some(
        (network) =>
            network &&
            "polkadot" in network &&
            typeof network.polkadot !== "boolean" &&
            network.polkadot?.target === "evm",
    )
}

function resolveResolcConfig(userConfig: HardhatUserConfig): ResolcConfig {
    const isNpm = userConfig.resolc?.compilerSource === "npm"
    const defaultConfig = isNpm ? defaultNpmResolcConfig : defaultBinaryResolcConfig
    const customConfig = userConfig.resolc ?? {}

    const optimizer = {
        ...defaultConfig.settings?.optimizer,
        ...customConfig.settings?.optimizer,
    }

    return {
        ...defaultConfig,
        ...customConfig,
        settings: {
            ...customConfig.settings,
            optimizer,
        },
    }
}

const configHookHandler: () => Promise<Partial<ConfigHooks>> = async () => ({
    extendUserConfig: async (config, next) => {
        if (!hasPolkadotNetwork(config) || isTargetingEvm(config)) {
            return next(config)
        }

        const resolc = resolveResolcConfig(config)

        return next({
            ...config,
            resolc,
        })
    },

    validateUserConfig: async (config) => {
        const errors: HardhatUserConfigValidationError[] = []

        if (config.resolc === undefined) return errors

        if (
            config.resolc.compilerSource !== undefined &&
            config.resolc.compilerSource !== "binary" &&
            config.resolc.compilerSource !== "npm"
        ) {
            errors.push({
                path: ["resolc", "compilerSource"],
                message: `Invalid compiler source: "${config.resolc.compilerSource}". Must be "binary" or "npm".`,
            })
        }

        if (config.resolc.version !== undefined && typeof config.resolc.version !== "string") {
            errors.push({
                path: ["resolc", "version"],
                message: "Expected a string for resolc version.",
            })
        }

        return errors
    },

    resolveUserConfig: async (userConfig, resolveConfigurationVariable, next) => {
        const resolvedConfig = await next(userConfig, resolveConfigurationVariable)

        if (!hasPolkadotNetwork(userConfig) || isTargetingEvm(userConfig)) {
            return resolvedConfig
        }

        return {
            ...resolvedConfig,
            resolc: resolveResolcConfig(userConfig),
        }
    },
})

export default configHookHandler
