import debug from "debug"

import { HardhatContext } from "hardhat/internal/context"
import { loadConfigAndTasks } from "hardhat/internal/core/config/config-loading"
import { getEnvHardhatArguments } from "hardhat/internal/core/params/env-variables"
import { HARDHAT_PARAM_DEFINITIONS } from "hardhat/internal/core/params/hardhat-params"
import { Environment } from "hardhat/internal/core/runtime-environment"
import { loadTsNode, willRunWithTypescript } from "hardhat/internal/core/typescript-support"
import {
    disableReplWriterShowProxy,
    isNodeCalledWithoutAScript,
} from "hardhat/internal/util/console"
import { LazyInitializationProviderAdapter } from "hardhat/internal/core/providers/lazy-initialization"
import { log } from "console"
import { createProvider } from "hardhat/internal/core/providers/construction"
import { Artifacts } from "hardhat/internal/artifacts"
import { BASE_URL, POLKADOT_TEST_NODE_NETWORK_NAME } from "../constants"
import { getNetworkConfig } from "../utils"
import "source-map-support/register";

if (!HardhatContext.isCreated()) {

    const ctx = HardhatContext.createHardhatContext()

    if (isNodeCalledWithoutAScript()) {
        disableReplWriterShowProxy()
    }

    const hardhatArguments = getEnvHardhatArguments(HARDHAT_PARAM_DEFINITIONS, process.env)

    if (hardhatArguments.verbose) {
        debug.enable("hardhat*")
    }

    if (willRunWithTypescript(hardhatArguments.config)) {
        loadTsNode(hardhatArguments.tsconfig, hardhatArguments.typecheck)
    }

    const { resolvedConfig, userConfig } = loadConfigAndTasks(hardhatArguments)

    const env = new Environment(
        resolvedConfig,
        hardhatArguments,
        ctx.tasksDSL.getTaskDefinitions(),
        ctx.tasksDSL.getScopesDefinitions(),
        ctx.environmentExtenders,
        userConfig,
        ctx.providerExtenders,
    )

    const polkadotNodePort = process.env.polkadotNodePort
    const url = `${BASE_URL}:${polkadotNodePort}`
    const networkName = POLKADOT_TEST_NODE_NETWORK_NAME

    env.network.name = networkName
    Object.assign(env.network.config, getNetworkConfig(url))
    resolvedConfig.networks[env.network.name] = env.network.config

    const artifacts = new Artifacts(resolvedConfig.paths.artifacts)

    const provider = new LazyInitializationProviderAdapter(async () => {
        log(`Creating provider for network ${networkName}`);
        return createProvider(resolvedConfig, networkName, artifacts, ctx.providerExtenders);
    });


    env.network.provider = provider
    ctx.setHardhatRuntimeEnvironment(env)

    env.injectToGlobal()
}
