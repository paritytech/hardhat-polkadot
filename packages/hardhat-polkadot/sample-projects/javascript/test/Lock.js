const { expect } = require("chai");
const hre = require("hardhat");

describe("Lock", function () {
    async function deployOneYearLockFixture() {
        const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
        const ONE_GWEI = 1_000_000_000;

        const block = await hre.ethers.provider.getBlock("latest");

        const lockedAmount = ONE_GWEI;
        const unlockTime = block?.timestamp ? block?.timestamp + ONE_YEAR_IN_SECS : 0;

        const [owner, otherAccount] = await hre.ethers.getSigners();

        const Lock = await hre.ethers.getContractFactory("Lock");
        const lock = await Lock.deploy(unlockTime, { value: lockedAmount });
        lock.waitForDeployment()

        return { lock, unlockTime, lockedAmount, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right unlockTime", async function () {
            const { lock, unlockTime } = await deployOneYearLockFixture();

            expect(await lock.unlockTime()).to.equal(unlockTime);
        });

        it("Should set the right owner", async function () {
            const { lock, owner } = await deployOneYearLockFixture();

            expect(await lock.owner()).to.equal(owner.address);
        });

        it("Should receive and store the funds to lock", async function () {
            const { lock, lockedAmount } = await deployOneYearLockFixture()

            expect(await hre.ethers.provider.getBalance(lock.target)).to.equal(
                lockedAmount
            );
        });

        it("Should fail if the unlockTime is not in the future", async function () {
            const block = await hre.ethers.provider.getBlock("latest");
            const latestTime = block?.timestamp ? block.timestamp : 0 ;
            const Lock = await hre.ethers.getContractFactory("Lock");
            try {
                await Lock.deploy(latestTime, { value: 1_000_000_000 });
            } catch (err) {
                expect(err.message).to.include("execution reverted");
            }

        });
    });

    describe("Withdrawals", function () {
        describe("Validations", function () {
            it("Should revert with the right error if called too soon", async function () {
                const { lock } = await deployOneYearLockFixture();

                await expect(lock.withdraw()).to.be.revertedWith(
                    "You can't withdraw yet"
                );
            });

        });
    });
});
