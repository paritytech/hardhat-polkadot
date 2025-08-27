// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

/**
 * @title DebugExample
 * @dev Example contract demonstrating console.sol usage with Substrate
 * 
 * This contract shows various console.log patterns that work with the
 * Substrate console.sol precompile implementation.
 */
contract DebugExample {
    // State variables for demonstration
    uint256 public counter;
    mapping(address => uint256) public balances;
    address public owner;
    
    // Events for comparison with console.log
    event CounterIncremented(uint256 newValue);
    event BalanceUpdated(address indexed user, uint256 newBalance);
    
    constructor() {
        owner = msg.sender;
        console.log("DebugExample contract deployed by:", msg.sender);
        console.log("Initial counter value:", counter);
    }
    
    /**
     * @dev Increment counter with debug logging
     */
    function incrementCounter() public {
        console.log("incrementCounter called by:", msg.sender);
        console.log("Counter before increment:", counter);
        
        counter++;
        
        console.log("Counter after increment:", counter);
        emit CounterIncremented(counter);
    }
    
    /**
     * @dev Update balance with various log types
     */
    function updateBalance(uint256 amount) public {
        console.log("=== updateBalance called ===");
        console.log("Caller:", msg.sender);
        console.log("Amount:", amount);
        console.log("Current balance:", balances[msg.sender]);
        
        uint256 oldBalance = balances[msg.sender];
        balances[msg.sender] = amount;
        
        // Demonstrate conditional logging
        if (amount > oldBalance) {
            console.log("Balance increased by:", amount - oldBalance);
        } else if (amount < oldBalance) {
            console.log("Balance decreased by:", oldBalance - amount);
        } else {
            console.log("Balance unchanged");
        }
        
        console.log("New balance:", balances[msg.sender]);
        emit BalanceUpdated(msg.sender, amount);
    }
    
    /**
     * @dev Demonstrate all supported console.log types
     */
    function demonstrateLogTypes() public view {
        console.log("=== Console.log Type Demonstrations ===");
        
        // String logging
        console.log("This is a string message");
        
        // Number logging
        console.log("Block number:", block.number);
        console.log("Gas left:", gasleft());
        console.log("Timestamp:", block.timestamp);
        
        // Address logging
        console.log("Contract address:", address(this));
        console.log("Sender address:", msg.sender);
        console.log("Owner address:", owner);
        
        // Boolean logging
        console.log("Is owner:", msg.sender == owner);
        console.log("Has balance:", balances[msg.sender] > 0);
        
        // Bytes logging
        bytes32 hash = keccak256("test");
        console.log("Keccak256 hash:", uint256(hash));
    }
    
    /**
     * @dev Complex debugging scenario
     */
    function complexOperation(uint256 input) public returns (uint256) {
        console.log("=== Starting complex operation ===");
        console.log("Input value:", input);
        
        // Step 1: Validation
        console.log("Step 1: Validating input");
        require(input > 0, "Input must be positive");
        console.log("Validation passed");
        
        // Step 2: Processing
        console.log("Step 2: Processing calculation");
        uint256 result = input * 2;
        console.log("Intermediate result:", result);
        
        // Step 3: Apply modifier based on sender
        if (msg.sender == owner) {
            console.log("Owner bonus applied");
            result += 10;
        } else {
            console.log("Regular user, no bonus");
        }
        
        // Step 4: Final adjustments
        console.log("Step 3: Final adjustments");
        if (result > 100) {
            console.log("Result exceeds 100, capping");
            result = 100;
        }
        
        console.log("Final result:", result);
        console.log("=== Complex operation completed ===");
        
        return result;
    }
    
    /**
     * @dev Debug function with error handling
     */
    function debugWithErrors(uint256 value) public {
        console.log("debugWithErrors called with:", value);
        
        if (value == 0) {
            console.log("ERROR: Zero value not allowed");
            revert("Zero value not allowed");
        }
        
        if (value > 1000) {
            console.log("WARNING: Large value detected:", value);
        }
        
        console.log("Processing value:", value);
        counter += value;
        console.log("Counter updated to:", counter);
    }
    
    /**
     * @dev Loop debugging example
     */
    function debugLoop(uint256 iterations) public {
        console.log("Starting loop with iterations:", iterations);
        
        for (uint256 i = 0; i < iterations && i < 10; i++) {
            console.log("Iteration:", i);
            
            if (i == 5) {
                console.log("Reached midpoint");
            }
        }
        
        console.log("Loop completed");
    }
    
    /**
     * @dev Gas usage debugging
     */
    function debugGasUsage() public {
        uint256 gasStart = gasleft();
        console.log("Gas at start:", gasStart);
        
        // Perform some operations
        uint256 temp = 0;
        for (uint256 i = 0; i < 100; i++) {
            temp += i;
        }
        
        uint256 gasAfterLoop = gasleft();
        console.log("Gas after loop:", gasAfterLoop);
        console.log("Gas used by loop:", gasStart - gasAfterLoop);
        
        // Storage operation
        counter = temp;
        
        uint256 gasAfterStorage = gasleft();
        console.log("Gas after storage:", gasAfterStorage);
        console.log("Gas used by storage:", gasAfterLoop - gasAfterStorage);
        
        console.log("Total gas used:", gasStart - gasAfterStorage);
    }
}