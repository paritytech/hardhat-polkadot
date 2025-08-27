import "@nomicfoundation/hardhat-ethers"
import hre from "hardhat"
import { expect } from "chai"

describe("Greeter", function () {
    // We define a fixture to reuse the same deployment across tests.
    //
    // ⚠️ Note: `loadFixture` does not currently work with Polkadot.
    async function deployGreeterFixture() {
        const [deployer] = await hre.ethers.getSigners()

        const greeterFactory = await hre.ethers.getContractFactory("Greeter")
        const greeter = await greeterFactory.connect(deployer).deploy("Hello, world!")

        return { greeter }
    }

    it("Should set the greeting to the constructor argument", async function () {
        const { greeter } = await deployGreeterFixture()

        expect(await greeter.greet()).to.equal("Hello, world!")
    })
})
