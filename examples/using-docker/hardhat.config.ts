import '@nomicfoundation/hardhat-chai-matchers';
import '@parity/hardhat-polkadot';
import '@nomicfoundation/hardhat-ignition';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    solidity: '0.8.28',
    networks: {
        hardhat: {
            polkavm: true,
            // see https://github.com/paritytech/hardhat-polkadot/blob/500cba0310fad38cf01cc7b11cb2e4043bd71482/packages/hardhat-polkadot-node/src/type-extensions.ts#L33
            docker: true,
        },
    },
};

export default config;
