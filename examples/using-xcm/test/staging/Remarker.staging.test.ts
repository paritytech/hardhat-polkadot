import "@nomicfoundation/hardhat-ethers"
import hre from "hardhat"
import { expect } from "chai"

import { TEST_NETWORKS } from "../../hardhat.config"
import { getRemark } from "../../utils/xcm/get-remark"

import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { createClient } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { passetHub } from "@polkadot-api/descriptors"
import { blake2AsHex } from "@polkadot/util-crypto"

!TEST_NETWORKS.includes(hre.network.name)
    ? describe.skip
    : describe("Remarker", function () {
          it("Should set the message to the constructor argument and emit an event", async function () {
              // Deploy the contract
              const Remarker = await hre.ethers.getContractFactory("Remarker")
              const remarkString = "Hello, Polkadot!"
              const remarker = await Remarker.deploy(await getRemark(remarkString))

              // Connect to PAsset Hub
              const client = createClient(
                  withPolkadotSdkCompat(getWsProvider("https://testnet-passet-hub.polkadot.io")),
              )
              const api = client.getTypedApi(passetHub)

              // Setup event listener
              type RemarkedEvent = ReturnType<typeof api.event.System.Remarked.filter>[0]
              const eventPromise = new Promise<RemarkedEvent>((resolve, reject) => {
                  setTimeout(() => reject(new Error("Timeout")), 24000)

                  const unsub = api.query.System.Events.watchValue("best").subscribe((records) => {
                      const events = api.event.System.Remarked.filter(records.map((r) => r.event))
                      if (events.length > 0) {
                          unsub.unsubscribe()
                          resolve(events[0])
                      }
                  })
              })

              await remarker.remark()
              const event = await eventPromise

              const expectedHash = blake2AsHex(remarkString)
              console.log("Event hash:", event.hash.asHex())
              console.log("Expected hash:", expectedHash)
              expect(event.hash.asHex()).to.equal(expectedHash)
          })
      })
