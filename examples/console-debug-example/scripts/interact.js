const hre = require("hardhat");

async function main() {
    // Get the deployed contract address (update this with your deployed address)
    const contractAddress = process.env.DEBUG_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    console.log("Interacting with DebugExample at:", contractAddress);
    
    // Get the contract instance
    const DebugExample = await hre.ethers.getContractFactory("DebugExample");
    const debugExample = DebugExample.attach(contractAddress);
    
    // Get signers
    const [signer] = await hre.ethers.getSigners();
    console.log("Using account:", signer.address);
    
    console.log("\n=== Testing Complex Operation ===");
    console.log("Calling complexOperation(50)...");
    let tx = await debugExample.complexOperation(50);
    await tx.wait();
    console.log("Check node logs for detailed debug output");
    
    console.log("\n=== Testing Error Handling ===");
    console.log("Calling debugWithErrors(500)...");
    tx = await debugExample.debugWithErrors(500);
    await tx.wait();
    
    console.log("Calling debugWithErrors(1500) - should show warning...");
    tx = await debugExample.debugWithErrors(1500);
    await tx.wait();
    
    console.log("\n=== Testing Loop Debugging ===");
    console.log("Calling debugLoop(8)...");
    tx = await debugExample.debugLoop(8);
    await tx.wait();
    
    console.log("\n=== Testing Gas Usage Analysis ===");
    console.log("Calling debugGasUsage()...");
    tx = await debugExample.debugGasUsage();
    await tx.wait();
    
    console.log("\n=== Reading Current State ===");
    const counter = await debugExample.counter();
    console.log("Current counter value:", counter.toString());
    
    const balance = await debugExample.balances(signer.address);
    console.log("Current balance for", signer.address, ":", balance.toString());
    
    console.log("\n=== Testing Different Value Types ===");
    console.log("Demonstrating all log types...");
    tx = await debugExample.demonstrateLogTypes();
    await tx.wait();
    
    console.log("\n=== Batch Operations ===");
    for (let i = 1; i <= 3; i++) {
        console.log(`Increment #${i}...`);
        tx = await debugExample.incrementCounter();
        await tx.wait();
    }
    
    console.log("\nAll interactions complete!");
    console.log("Review your Substrate node console for all debug messages.");
    console.log("\nTip: Run your node with '--log evm=debug' for maximum visibility");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });