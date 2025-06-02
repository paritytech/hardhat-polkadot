import { expect } from "chai"
import { parseUnits } from "viem"
import hre from "hardhat"

describe("MyToken (Hardhat + Viem)", () => {
    const toWei = (val: string) => parseUnits(val, 18)

    let publicClient: any
    let walletClient: any
    let token: any
    let deployer: any
    let addr1: any
    let addr2: any

    beforeEach(async () => {
        // Hardhat automatically provides signers with walletClients
        const accounts = await hre.viem.getWalletClients()
        ;[walletClient, addr1, addr2] = accounts
        deployer = walletClient.account

        publicClient = await hre.viem.getPublicClient()

        // Deploy the contract using Viem
        const hash = await walletClient.deployContract({
            abi: (await hre.artifacts.readArtifact("MyToken")).abi,
            bytecode: (await hre.artifacts.readArtifact("MyToken")).bytecode as `0x${string}`,
            args: [toWei("1000000")],
        })

        const receipt = await publicClient.waitForTransactionReceipt({ hash })

        token = await hre.viem.getContractAt("MyToken", receipt.contractAddress!, {
            walletClient,
        })
    })

    it("assigns initial supply to deployer", async () => {
        const balance = await token.read.balanceOf([deployer.address])
        expect(balance).to.equal(toWei("1000000"))
    })

    it("allows minting by MINTER_ROLE", async () => {
        const amount = toWei("1000")
        await token.write.mint([addr1.account.address, amount])

        const balance = await token.read.balanceOf([addr1.account.address])
        expect(balance).to.equal(amount)
    })

    it("rejects minting by non-minters", async () => {
        const amount = toWei("1000")

        const tokenAsAddr1 = token.connect(addr1)
        await expect(() => tokenAsAddr1.write.mint([addr2.account.address, amount])).to.throw(
            /AccessControlUnauthorizedAccount/,
        )
    })

    it("allows burning", async () => {
        const burnAmount = toWei("500")
        await token.write.burn([burnAmount])

        const balance = await token.read.balanceOf([deployer.address])
        expect(balance).to.equal(toWei("1000000") - burnAmount)
    })

    it("pauses transfers", async () => {
        await token.write.pause()
        await expect(() => token.write.transfer([addr1.account.address, 1n])).to.throw(
            /EnforcedPause/,
        )
    })

    it("rejects pause by non-pauser", async () => {
        const tokenAsAddr1 = token.connect(addr1)
        await expect(() => tokenAsAddr1.write.pause()).to.throw(/AccessControlUnauthorizedAccount/)
    })

    it("unpauses transfers", async () => {
        await token.write.pause()
        await token.write.unpause()
        await expect(() => token.write.transfer([addr1.account.address, 100n])).not.to.throw()
    })

    it("assigns roles correctly", async () => {
        const MINTER_ROLE = await token.read.MINTER_ROLE()
        const PAUSER_ROLE = await token.read.PAUSER_ROLE()

        const isMinter = await token.read.hasRole([MINTER_ROLE, deployer.address])
        const isPauser = await token.read.hasRole([PAUSER_ROLE, deployer.address])

        expect(isMinter).to.be.true
        expect(isPauser).to.be.true
    })
})
