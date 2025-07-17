import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

import { getRemark } from "../../utils/xcm/get-remark"

const GreeterModule = buildModule("RemarkerModule", (m) => {
    const message = getRemark("Hello, Polkadot!")

    const remarker = m.contract("Remarker", [message])

    return { remarker }
})

export default GreeterModule
