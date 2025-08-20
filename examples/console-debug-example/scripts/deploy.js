const hre = require("hardhat");

async function main() {
    console.log("Deploying DebugExample contract...");
    
    // Get the contract factory
    const DebugExample = await hre.ethers.getContractFactory("DebugExample");
    
    // Deploy the contract
    console.log("Sending deployment transaction...");
    const debugExample = await DebugExample.deploy();
    
    // Wait for deployment
    await debugExample.deployed();
    
    console.log("DebugExample deployed to:", debugExample.address);
    console.log("Check your Substrate node logs for console.log output!");
    
    // Demonstrate some basic calls
    console.log("\n=== Calling incrementCounter ===");
    const tx1 = await debugExample.incrementCounter();
    await tx1.wait();
    
    console.log("\n=== Calling demonstrateLogTypes ===");
    const tx2 = await debugExample.demonstrateLogTypes();
    await tx2.wait();
    
    console.log("\n=== Calling updateBalance with 1000 ===");
    const tx3 = await debugExample.updateBalance(1000);
    await tx3.wait();
    
    console.log("\nDeployment and initial interactions complete!");
    console.log("Check your Substrate node console for debug output.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });