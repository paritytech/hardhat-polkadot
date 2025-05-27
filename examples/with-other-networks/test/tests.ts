import { expect } from 'chai';
import hre from 'hardhat';

describe('Greeter', function () {
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
