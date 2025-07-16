import "@nomicfoundation/hardhat-ethers"
import hre from "hardhat"

import { TEST_NETWORKS } from "../../hardhat.config"

!TEST_NETWORKS.includes(hre.network.name)
    ? describe.skip(`Not available for network ${hre.network.name}`, function () {})
    : describe("Remarker", function () {
          // We define a fixture to reuse the same deployment across tests.
          //
          // ⚠️ Note: `loadFixture` does not currently work with PolkaVM-compatible networks.
          async function deployRemarkerFixture() {
              const [deployer] = await hre.ethers.getSigners()

              const remarkerFactory = await hre.ethers.getContractFactory("Remarker")

              const remarker = await remarkerFactory
                  .connect(deployer)
                  .deploy("0x05040600004000073448656c6c6f2c20576f726c6421")

              return { remarker }
          }

          it("Should set the message to the constructor argument", async function () {
              const { remarker } = await deployRemarkerFixture()

              console.log(await remarker.remark())
          })
      })
