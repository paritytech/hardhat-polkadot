require("@nomicfoundation/hardhat-ethers")
const { ethers } = require("hardhat")
const { expect } = require("chai")

describe("FactoryUups", function () {
    async function deployFactoryUupsFixture() {
        const [owner, otherAccount] = await ethers.getSigners()

        const FactoryUups = await ethers.getContractFactory("FactoryUups")
        const factoryUups = await FactoryUups.deploy()

        return { factoryUups, owner, otherAccount }
    }

    describe("Deployment", function () {
        it("Should set the right numberOfDeployedContracts", async function () {
            const { factoryUups } = await deployFactoryUupsFixture()

            expect(await factoryUups.getNumberOfDeployedContracts()).to.equal(0)
        })
    })

    describe("deployEmptyContract works", function () {
        it("Should increase numberOfDeployedContracts", async function () {
            const { factoryUups } = await deployFactoryUupsFixture()
            await factoryUups.deployEmptyContract()

            expect(await factoryUups.getNumberOfDeployedContracts()).to.equal(1)
        })
    })
})
