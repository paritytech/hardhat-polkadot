import "@nomicfoundation/hardhat-ethers"
import hre from "hardhat"

import { TEST_NETWORKS } from "../../hardhat.config"
import { getRemark } from "../../utils/xcm/get-remark"

!TEST_NETWORKS.includes(hre.network.name)
    ? describe.skip(`Not available for network ${hre.network.name}`, function () {})
    : describe("Remarker", function () {
          // We define a fixture to reuse the same deployment across tests.
          //
          // ⚠️ Note: `loadFixture` does not currently work with PolkaVM-compatible networks.
          async function deployRemarkerFixture() {
              const [deployer] = await hre.ethers.getSigners()

              const message = await getRemark("Hello, Polkadot!")

              const remarkerFactory = await hre.ethers.getContractFactory("Remarker")
              const remarker = await remarkerFactory.connect(deployer).deploy(message)

              return { remarker }
          }

          it("Should set the message to the constructor argument", async function () {
              const { remarker } = await deployRemarkerFixture()

              console.log(await remarker.remark())
          })
      })
