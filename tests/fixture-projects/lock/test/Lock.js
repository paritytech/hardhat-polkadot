import "@nomicfoundation/hardhat-ethers"
import { ethers } from "hardhat"
import { expect } from "chai"
import hre from "hardhat"

describe("Lock", function () {
    let lock
    let unlockTime
    let lockedAmount
    let owner
    let otherAccount

    before(async () => {
        const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
        const ONE_GWEI = 1_000_000_000

        const lockedAmount = ONE_GWEI
        const unlockTime = (await ethers.provider.getBlock("latest")).timestamp + 365 * 24 * 60 * 60

        const [owner, otherAccount] = await ethers.getSigners()
        const Lock = await ethers.getContractFactory("Lock")
        const lock = await Lock.deploy(unlockTime, { value: lockedAmount })

        lock = lock
        unlockTime = unlockTime
        lockedAmount = lockedAmount
        owner = owner
        otherAccount = otherAccount
    })

    describe("Deployment", function () {
        it("Should set the right unlockTime", async function () {
            const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture)

            expect(await lock.unlockTime()).to.equal(unlockTime)
        })

        it("Should set the right owner", async function () {
            const { lock, owner } = await loadFixture(deployOneYearLockFixture)

            expect(await lock.owner()).to.equal(owner.address)
        })

        it("Should receive and store the funds to lock", async function () {
            const { lock, lockedAmount } = await loadFixture(deployOneYearLockFixture)

            expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(lockedAmount)
        })

        it("Should fail if the unlockTime is not in the future", async function () {
            // We don't use the fixture here because we want a different deployment
            const latestTime = await time.latest()
            const Lock = await hre.ethers.getContractFactory("Lock")
            await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
                "Unlock time should be in the future",
            )
        })
    })

    describe("Withdrawals", function () {
        describe("Validations", function () {
            it("Should revert with the right error if called too soon", async function () {
                const { lock } = await loadFixture(deployOneYearLockFixture)

                await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet")
            })

            it("Should revert with the right error if called from another account", async function () {
                const { lock, unlockTime, otherAccount } =
                    await loadFixture(deployOneYearLockFixture)

                // We can increase the time in Hardhat Network
                await time.increaseTo(unlockTime)

                // We use lock.connect() to send a transaction from another account
                await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
                    "You aren't the owner",
                )
            })

            it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
                const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture)

                // Transactions are sent using the first signer by default
                await time.increaseTo(unlockTime)

                await expect(lock.withdraw()).not.to.be.reverted
            })
        })

        describe("Events", function () {
            it("Should emit an event on withdrawals", async function () {
                const { lock, unlockTime, lockedAmount } =
                    await loadFixture(deployOneYearLockFixture)

                await time.increaseTo(unlockTime)

                await expect(lock.withdraw())
                    .to.emit(lock, "Withdrawal")
                    .withArgs(lockedAmount, anyValue) // We accept any value as `when` arg
            })
        })

        describe("Transfers", function () {
            it("Should transfer the funds to the owner", async function () {
                const { lock, unlockTime, lockedAmount, owner } =
                    await loadFixture(deployOneYearLockFixture)

                await time.increaseTo(unlockTime)

                await expect(lock.withdraw()).to.changeEtherBalances(
                    [owner, lock],
                    [lockedAmount, -lockedAmount],
                )
            })
        })
    })
})
