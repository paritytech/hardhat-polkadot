import { HardhatUserConfig } from "hardhat/config"
import "hardhat-resolc"

const config: HardhatUserConfig = {
    solidity: "0.8.28",
    networks: {
        hardhat: {
            polkavm: true,
        },
    },
    resolc: {
        compilerSource: "binary",
        settings: {
            /**
             * Path to the `resolc` binary
             */
            compilerPath: "/path/to/resolc",
            /**
             * Switch to Yul mode. Only one input Yul file is allowed.
             */
            yul: true,
            /**
             * The optimizer is enabled by default, so with this we are disabling it.
             * If we just ignore it, it will default to `3`.
             */
            disableSolcOptimizer: true,
            /**
             * Whether to emit or not debug info.
             */
            emitDourceDebugInfo: true,
            /**
             * Specify a path where we want the debug info stored at.
             */
            debugOutputDir: "/path/to/debug/output",
            /**
             * Specify a path where we want the compiled files to be stored at.
             */
            outputDir: "/path/to/output",
            evmVersion: "istanbul",
        },
    },
}

export default config
