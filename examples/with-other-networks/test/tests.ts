import { expect } from 'chai';
import hre from 'hardhat';

describe('Greeter', function () {
    const isPolkadot = hre.network.polkavm;

    // This is an example on how to skip tests that, due to incompatibilities,
    // are currently not working with Polkadot.
    // There are many other variations on how to do this.
    it('Should run only on Kitchensink', async function () {
        if (!isPolkadot) {
            console.log(`Skipping test: not running on Kitchensink`);
            this.skip();
        }
        const network = await hre.ethers.provider.getNetwork();

        expect(network.chainId.toString()).to.equal('420420421');
    });

    it('Should set the greeting to the constructor argument', async function () {
        const greeting = 'Hello, world!';

        const greeter = await hre.ethers.deployContract('Greeter', [greeting]);

        expect(await greeter.greet()).to.equal(greeting);
    });

    it('Should return the current greeting', async function () {
        const greeting = 'Hello, world!';

        const greeter = await hre.ethers.deployContract('Greeter', [greeting]);

        expect(await greeter.greet()).to.equal(greeting);
    });

    it('Should set a new greeting', async function () {
        const initialGreeting = 'Hello, world!';
        const newGreeting = 'Hello, Ethereum!';

        const greeter = await hre.ethers.deployContract('Greeter', [initialGreeting]);

        await greeter.setGreeting(newGreeting);

        expect(await greeter.greet()).to.equal(newGreeting);
    });
});
