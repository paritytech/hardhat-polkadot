import { ethers } from "hardhat"
import "@nomicfoundation/hardhat-ethers"

// npx hardhat run ./scripts/deploy-greet.ts --network local
async function main() {
    const signer = await ethers.provider.getSigner()

    const Greeter = await ethers.getContractFactory("Greeter", signer)
    const greeter = await Greeter.deploy("Hello, World!")
    await greeter.waitForDeployment()

    const contractAddress = await greeter.getAddress()

    console.log(`deployed to ${contractAddress}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
