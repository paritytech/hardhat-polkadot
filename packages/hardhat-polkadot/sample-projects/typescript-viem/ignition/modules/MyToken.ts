// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"
import { parseEther } from "viem"

const INITIAL_SUPPLY: bigint = parseEther("1000000000000")
const MyTokenModule = buildModule("MyTokenModule", (m) => {
    const initialSupply = m.getParameter("initialSupply", INITIAL_SUPPLY)

    const token = m.contract("MyToken", [initialSupply])

    return { token }
})

export default MyTokenModule
