// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 * Test contract for console.sol precompile functionality
 */
contract ConsoleTest {
    uint256 public counter = 0;
    address public owner;
    
    constructor() {
        owner = msg.sender;
        console.log("ConsoleTest contract deployed by:", owner);
    }
    
    /**
     * Test basic string logging
     */
    function testStringLog() public view {
        console.log("Hello from Polkadot!");
        console.log("This is a test of the console.sol precompile");
    }
    
    /**
     * Test number logging
     */
    function testNumberLog() public {
        counter++;
        console.log("Counter value:", counter);
        console.log(42);
        console.log(uint256(1234567890));
    }
    
    /**
     * Test address logging
     */
    function testAddressLog() public view {
        console.log("Contract address:", address(this));
        console.log("Sender address:", msg.sender);
        console.log("Owner address:", owner);
    }
    
    /**
     * Test boolean logging
     */
    function testBooleanLog() public view {
        console.log("Is owner:", msg.sender == owner);
        console.log(true);
        console.log(false);
    }
    
    /**
     * Test combined logging with labels
     */
    function testCombinedLog() public view {
        console.log("Block number:", block.number);
        console.log("Block timestamp:", block.timestamp);
        console.log("Gas limit:", block.gaslimit);
        console.log("Chain ID:", block.chainid);
    }
    
    /**
     * Test all log types in one function
     */
    function testAllLogTypes() public {
        console.log("=== Starting comprehensive test ===");
        
        // String logs
        console.log("Testing string output");
        
        // Number logs
        console.log("Testing number:", 999);
        console.log(uint256(0));
        console.log(uint256(2**256 - 1)); // Max uint256
        
        // Address logs
        console.log("Testing address:", address(0));
        console.log("Contract:", address(this));
        
        // Boolean logs
        console.log("Testing boolean:", true);
        console.log("Is zero:", 0 == 0);
        
        // Update state
        counter = counter + 10;
        console.log("Counter updated to:", counter);
        
        console.log("=== Test complete ===");
    }
    
    /**
     * Test logging in a loop
     */
    function testLoopLog(uint256 iterations) public {
        console.log("Starting loop with iterations:", iterations);
        
        for (uint256 i = 0; i < iterations && i < 10; i++) {
            console.log("Iteration:", i);
        }
        
        console.log("Loop complete");
    }
    
    /**
     * Test logging in require statements
     */
    function testRequireLog(uint256 value) public view {
        console.log("Checking value:", value);
        
        if (value == 0) {
            console.log("Warning: value is zero");
        }
        
        require(value > 0, "Value must be greater than zero");
        console.log("Value check passed");
    }
    
    /**
     * Test logging in modifier
     */
    modifier logExecution() {
        console.log("Modifier: Function execution started");
        console.log("Modifier: Caller is", msg.sender);
        _;
        console.log("Modifier: Function execution completed");
    }
    
    function testModifierLog() public logExecution {
        console.log("Inside main function");
    }
}