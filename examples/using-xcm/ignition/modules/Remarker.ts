import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const INITIAL_MESSAGE = "0x05040600004000073448656c6c6f2c20576f726c6421"

const GreeterModule = buildModule("RemarkerModule", (m) => {
    const remarker = m.contract("Greeter", [INITIAL_MESSAGE])

    return { remarker }
})

export default GreeterModule
