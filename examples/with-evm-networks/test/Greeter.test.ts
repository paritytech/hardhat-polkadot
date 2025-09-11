import '@nomicfoundation/hardhat-ethers';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import hre from 'hardhat';

describe('Greeter', function () {
    const isPolkadotCompatible = !!hre.network.polkadot;

    // This is an example on how to skip tests that, due to incompatibilities,
    // are currently not working with Polkadot.
    // There are many other variations on how to do this.
    it('Should run only on compatible Polkadot chains', async function () {
        if (!isPolkadotCompatible) {
            console.log(`Skipping test: not running on compatible Polkadot chains.`);
            this.skip();
        }
        const network = await hre.ethers.provider.getNetwork();

        expect(network.chainId.toString().startsWith('420420')).to.be.true;
    });

    // We define a fixture to reuse the same deployment across tests.
    // `loadFixture` snapshots the network state after the first run
    // and restores it before each test, ensuring isolated test runs.
    //
    async function deployGreeterFixture() {
        const [deployer] = await hre.ethers.getSigners();

        const greeterFactory = await hre.ethers.getContractFactory('Greeter');
        const greeter = await greeterFactory.connect(deployer).deploy('Hello, world!');

        return { greeter, deployer };
    }

    it('Should set the greeting to the constructor argument', async function () {
        const { greeter } = isPolkadotCompatible
            ? await deployGreeterFixture()
            : await loadFixture(deployGreeterFixture);

        expect(await greeter.greet()).to.equal('Hello, world!');
    });
});
