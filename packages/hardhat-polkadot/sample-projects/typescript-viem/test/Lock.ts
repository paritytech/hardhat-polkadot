import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseGwei } from "viem";

describe("Lock", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployOneYearLockFixture() {
        const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;

        const lockedAmount = parseGwei("1");
        const block = await hre.ethers.provider.getBlock("latest");

        const unlockTime = BigInt(block?.timestamp! + ONE_YEAR_IN_SECS);
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await hre.viem.getWalletClients();

        const lock = await hre.viem.deployContract("Lock", [unlockTime], {
            value: lockedAmount,
        });

        await lock.waitForDeployment()

        const publicClient = await hre.viem.getPublicClient();

        return {
            lock,
            unlockTime,
            lockedAmount,
            owner,
            otherAccount,
            publicClient,
        };
    }

    describe("Deployment", function () {
        it("Should set the right unlockTime", async function () {
            const { lock, unlockTime } = await deployOneYearLockFixture();

            expect(await lock.read.unlockTime()).to.equal(unlockTime);
        });

        it("Should set the right owner", async function () {
            const { lock, owner } = await deployOneYearLockFixture();

            expect(await lock.read.owner()).to.equal(
                getAddress(owner.account.address)
            );
        });

        it("Should receive and store the funds to lock", async function () {
            const { lock, lockedAmount, publicClient } = await deployOneYearLockFixture()

            expect(
                await publicClient.getBalance({
                    address: lock.address,
                })
            ).to.equal(lockedAmount);
        });

        it("Should fail if the unlockTime is not in the future", async function () {
            // We don't use the fixture here because we want a different deployment
            const block = await hre.ethers.provider.getBlock("latest");
            const latestTime = BigInt(block?.timestamp!);
            try {
                hre.viem.deployContract("Lock", [latestTime], {
                    value: 1n,
                })
            } catch (err) {
                expect(err.message).to.include("execution reverted");

            }

        });
    });

    describe("Withdrawals", function () {
        describe("Validations", function () {
            it("Should revert with the right error if called too soon", async function () {
                const { lock } = await deployOneYearLockFixture();

                await expect(lock.write.withdraw()).to.be.revertedWith(
                    "You can't withdraw yet"
                );
            });
        });
    });
});
