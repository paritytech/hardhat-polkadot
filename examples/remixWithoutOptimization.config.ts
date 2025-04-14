import { HardhatUserConfig } from "hardhat/config";
import "@parity/hardhat-polkadot-resolc";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      polkavm: true,
    },
  },
  resolc: {
    compilerSource: "npm",
  },
};
