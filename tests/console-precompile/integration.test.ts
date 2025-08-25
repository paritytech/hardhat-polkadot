import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { ConsoleLogHandler } from "../../packages/hardhat-polkadot-node/src/services/console-handler";

describe("Console Precompile Integration Tests", function () {
    let debugContract: Contract;
    let consoleHandler: ConsoleLogHandler;
    let capturedLogs: string[] = [];

    before(async function () {
        // Skip if not running against a Substrate node with console precompile
        if (process.env.SKIP_INTEGRATION_TESTS) {
            this.skip();
        }

        // Initialize console handler
        consoleHandler = new ConsoleLogHandler();
        
        // Capture console.log events
        consoleHandler.on("log", (message: string) => {
            capturedLogs.push(message);
        });

        // Deploy test contract
        const DebugExample = await ethers.getContractFactory("DebugExample");
        debugContract = await DebugExample.deploy();
        await debugContract.deployed();
    });

    beforeEach(function () {
        // Clear captured logs before each test
        capturedLogs = [];
    });

    describe("Basic Console.log Functionality", function () {
        it("should log deployment message", async function () {
            // The deployment should have already logged
            // Check if we captured the deployment log
            const deploymentLog = capturedLogs.find(log => 
                log.includes("DebugExample contract deployed")
            );
            expect(deploymentLog).to.exist;
        });

        it("should log string messages", async function () {
            const tx = await debugContract.demonstrateLogTypes();
            await tx.wait();

            // Check for string log
            const stringLog = capturedLogs.find(log => 
                log.includes("This is a string message")
            );
            expect(stringLog).to.exist;
        });

        it("should log numeric values", async function () {
            const tx = await debugContract.incrementCounter();
            await tx.wait();

            // Should have logged counter values
            const beforeLog = capturedLogs.find(log => 
                log.includes("Counter before increment")
            );
            const afterLog = capturedLogs.find(log => 
                log.includes("Counter after increment")
            );

            expect(beforeLog).to.exist;
            expect(afterLog).to.exist;
        });

        it("should log address values", async function () {
            const tx = await debugContract.demonstrateLogTypes();
            await tx.wait();

            // Check for address logs
            const addressLog = capturedLogs.find(log => 
                log.includes("0x") && (
                    log.includes("Contract address") ||
                    log.includes("Sender address") ||
                    log.includes("Owner address")
                )
            );
            expect(addressLog).to.exist;
        });

        it("should log boolean values", async function () {
            const tx = await debugContract.demonstrateLogTypes();
            await tx.wait();

            // Check for boolean logs
            const boolLog = capturedLogs.find(log => 
                log === "true" || log === "false" ||
                log.includes("Is owner:") ||
                log.includes("Has balance:")
            );
            expect(boolLog).to.exist;
        });
    });

    describe("Complex Logging Scenarios", function () {
        it("should log multiple values in sequence", async function () {
            const tx = await debugContract.updateBalance(1000);
            await tx.wait();

            // Should have multiple logs in sequence
            expect(capturedLogs.length).to.be.greaterThan(3);
            
            // Check for specific sequence markers
            const startLog = capturedLogs.find(log => 
                log.includes("=== updateBalance called ===")
            );
            const amountLog = capturedLogs.find(log => 
                log.includes("Amount:") && log.includes("1000")
            );
            
            expect(startLog).to.exist;
            expect(amountLog).to.exist;
        });

        it("should handle conditional logging", async function () {
            // First call - should increase
            let tx = await debugContract.updateBalance(500);
            await tx.wait();
            
            const increaseLog = capturedLogs.find(log => 
                log.includes("Balance increased by")
            );
            expect(increaseLog).to.exist;

            // Clear logs
            capturedLogs = [];

            // Second call with lower value - should decrease
            tx = await debugContract.updateBalance(300);
            await tx.wait();

            const decreaseLog = capturedLogs.find(log => 
                log.includes("Balance decreased by")
            );
            expect(decreaseLog).to.exist;
        });

        it("should log within loops", async function () {
            const tx = await debugContract.debugLoop(7);
            await tx.wait();

            // Count iteration logs
            const iterationLogs = capturedLogs.filter(log => 
                log.includes("Iteration:")
            );
            
            // Should have logged 7 iterations
            expect(iterationLogs.length).to.equal(7);

            // Check for midpoint log
            const midpointLog = capturedLogs.find(log => 
                log.includes("Reached midpoint")
            );
            expect(midpointLog).to.exist;
        });

        it("should log gas usage", async function () {
            const tx = await debugContract.debugGasUsage();
            await tx.wait();

            // Check for gas logs
            const gasStartLog = capturedLogs.find(log => 
                log.includes("Gas at start:")
            );
            const gasUsedLog = capturedLogs.find(log => 
                log.includes("Total gas used:")
            );

            expect(gasStartLog).to.exist;
            expect(gasUsedLog).to.exist;
        });
    });

    describe("Error Handling", function () {
        it("should log before reverting", async function () {
            try {
                const tx = await debugContract.debugWithErrors(0);
                await tx.wait();
                expect.fail("Should have reverted");
            } catch (error) {
                // Check if error was logged before revert
                const errorLog = capturedLogs.find(log => 
                    log.includes("ERROR: Zero value not allowed")
                );
                expect(errorLog).to.exist;
            }
        });

        it("should log warnings for large values", async function () {
            const tx = await debugContract.debugWithErrors(1500);
            await tx.wait();

            const warningLog = capturedLogs.find(log => 
                log.includes("WARNING: Large value detected")
            );
            expect(warningLog).to.exist;
        });
    });

    describe("Performance", function () {
        it("should have minimal gas overhead", async function () {
            // Get gas estimate without console.log (approximate)
            const gasEstimate = await debugContract.estimateGas.incrementCounter();
            
            // Execute with console.log
            const tx = await debugContract.incrementCounter();
            const receipt = await tx.wait();
            
            // Console.log should add ~300 gas (3 logs * 100 gas each)
            const expectedOverhead = 300n;
            const actualGas = receipt.gasUsed.toBigInt();
            const estimatedGas = gasEstimate.toBigInt();
            
            // Allow for some variance
            const difference = actualGas - estimatedGas;
            expect(difference).to.be.lessThan(expectedOverhead * 2n);
        });

        it("should handle high-frequency logging", async function () {
            this.timeout(10000); // Extend timeout for performance test
            
            const iterations = 10;
            const startTime = Date.now();
            
            for (let i = 0; i < iterations; i++) {
                const tx = await debugContract.incrementCounter();
                await tx.wait();
            }
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete within reasonable time
            expect(duration).to.be.lessThan(10000); // 10 seconds
            
            // Should have logged all iterations
            const incrementLogs = capturedLogs.filter(log => 
                log.includes("incrementCounter called")
            );
            expect(incrementLogs.length).to.equal(iterations);
        });
    });

    describe("Console Handler", function () {
        it("should properly parse console.log patterns", function () {
            const testCases = [
                { 
                    input: "console.log: Test message", 
                    expected: "Test message" 
                },
                { 
                    input: "runtime::console: Another test", 
                    expected: "Another test" 
                },
                { 
                    input: "2024-01-20 10:00:00 console.log: With timestamp", 
                    expected: "With timestamp" 
                },
                {
                    input: "0x000000000000000000636f6e736f6c652e6c6f67: Address format",
                    expected: "Address format"
                }
            ];

            testCases.forEach(testCase => {
                // Process the line
                consoleHandler.processOutput(testCase.input);
                
                // Check if the message was extracted correctly
                const lastLog = capturedLogs[capturedLogs.length - 1];
                expect(lastLog).to.include(testCase.expected);
            });
        });

        it("should handle different data types", function () {
            // Test address formatting
            consoleHandler.processOutput("console.log: 0x1234567890abcdef");
            let lastLog = capturedLogs[capturedLogs.length - 1];
            expect(lastLog).to.include("0x1234567890abcdef");

            // Test number formatting
            consoleHandler.processOutput("console.log: 42");
            lastLog = capturedLogs[capturedLogs.length - 1];
            expect(lastLog).to.equal("42");

            // Test boolean formatting
            consoleHandler.processOutput("console.log: true");
            lastLog = capturedLogs[capturedLogs.length - 1];
            expect(lastLog).to.equal("true");
        });

        it("should emit events for programmatic access", function (done) {
            consoleHandler.once("log", (message: string) => {
                expect(message).to.equal("Event test message");
                done();
            });

            consoleHandler.processOutput("console.log: Event test message");
        });

        it("should respect enabled/disabled state", function () {
            // Disable handler
            consoleHandler.setEnabled(false);
            
            const logsBefore = capturedLogs.length;
            consoleHandler.processOutput("console.log: Should not appear");
            
            expect(capturedLogs.length).to.equal(logsBefore);
            
            // Re-enable handler
            consoleHandler.setEnabled(true);
            consoleHandler.processOutput("console.log: Should appear");
            
            expect(capturedLogs.length).to.equal(logsBefore + 1);
        });
    });
});

// Solidity contract for testing (would be in separate file)
const DEBUG_CONTRACT_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract DebugExample {
    uint256 public counter;
    mapping(address => uint256) public balances;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        console.log("DebugExample contract deployed by:", msg.sender);
    }
    
    function incrementCounter() public {
        console.log("incrementCounter called by:", msg.sender);
        console.log("Counter before increment:", counter);
        counter++;
        console.log("Counter after increment:", counter);
    }
    
    function updateBalance(uint256 amount) public {
        console.log("=== updateBalance called ===");
        console.log("Amount:", amount);
        
        uint256 oldBalance = balances[msg.sender];
        balances[msg.sender] = amount;
        
        if (amount > oldBalance) {
            console.log("Balance increased by:", amount - oldBalance);
        } else if (amount < oldBalance) {
            console.log("Balance decreased by:", oldBalance - amount);
        }
    }
    
    function demonstrateLogTypes() public view {
        console.log("This is a string message");
        console.log("Contract address:", address(this));
        console.log("Sender address:", msg.sender);
        console.log("Owner address:", owner);
        console.log("Is owner:", msg.sender == owner);
        console.log("Has balance:", balances[msg.sender] > 0);
    }
    
    function debugLoop(uint256 iterations) public {
        for (uint256 i = 0; i < iterations && i < 10; i++) {
            console.log("Iteration:", i);
            if (i == 5) {
                console.log("Reached midpoint");
            }
        }
    }
    
    function debugGasUsage() public {
        uint256 gasStart = gasleft();
        console.log("Gas at start:", gasStart);
        
        uint256 temp = 0;
        for (uint256 i = 0; i < 100; i++) {
            temp += i;
        }
        counter = temp;
        
        console.log("Total gas used:", gasStart - gasleft());
    }
    
    function debugWithErrors(uint256 value) public {
        if (value == 0) {
            console.log("ERROR: Zero value not allowed");
            revert("Zero value not allowed");
        }
        
        if (value > 1000) {
            console.log("WARNING: Large value detected");
        }
        
        counter += value;
    }
}
`;