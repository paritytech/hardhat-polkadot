# Console.log Debug Example for Substrate

This example demonstrates how to use Hardhat's console.sol functionality with Substrate nodes that have the console precompile enabled.

## Prerequisites

1. A Substrate node with the console.sol precompile enabled (built with `--features dev`)
2. Hardhat configured for Polkadot/Substrate
3. Node.js and npm installed

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start your Substrate node with console support:
```bash
# Using Docker (recommended)
docker run -p 9944:9944 -p 9933:9933 paritytech/substrate-console:latest-dev \
  substrate --dev --unsafe-rpc-external --rpc-cors=all --log evm=debug

# Or using local build
substrate --dev --log evm=debug
```

3. Configure Hardhat (hardhat.config.js):
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-polkadot");

module.exports = {
  solidity: "0.8.19",
  networks: {
    substrate: {
      url: "http://localhost:9933",
      chainId: 42,
      accounts: {
        mnemonic: "bottom drive obey lake curtain smoke basket hold race lonely fit walk",
      },
    },
  },
};
```

## Usage

### Deploy the Debug Contract

```bash
npx hardhat run scripts/deploy.js --network substrate
```

You should see console.log output in your Substrate node logs:
```
console.log: DebugExample contract deployed by: 0x...
console.log: Initial counter value: 0
```

### Interact with the Contract

Run the example interactions:
```bash
npx hardhat run scripts/interact.js --network substrate
```

### Run Tests with Console Output

```bash
npx hardhat test --network substrate
```

## Console.log Patterns

### Basic Logging
```solidity
console.log("Simple message");
console.log("Value:", someUint);
console.log("Address:", someAddress);
console.log("Boolean:", someBool);
```

### Debugging State Changes
```solidity
function updateState(uint256 newValue) public {
    console.log("State before:", currentValue);
    currentValue = newValue;
    console.log("State after:", currentValue);
}
```

### Gas Usage Analysis
```solidity
uint256 gasStart = gasleft();
// ... operations ...
console.log("Gas used:", gasStart - gasleft());
```

### Error Debugging
```solidity
if (value == 0) {
    console.log("ERROR: Zero value detected");
    revert("Invalid value");
}
```

### Loop Debugging
```solidity
for (uint256 i = 0; i < items.length; i++) {
    console.log("Processing item:", i);
    // ... process item ...
}
```

## Viewing Console Output

Console.log messages appear in the Substrate node output. Look for patterns like:
- `console.log: [your message]`
- `runtime::console [your message]`
- Log entries at address `0x000000000000000000636F6e736F6c652e6c6f67`

### Enable Debug Logging

For maximum visibility, run your node with debug logging:
```bash
substrate --dev --log evm=debug,runtime=debug
```

### Filter Console Output

To see only console.log messages:
```bash
substrate --dev 2>&1 | grep "console.log"
```

## Important Notes

1. **Development Only**: Console.log is only available in development builds
2. **Gas Cost**: Each console.log costs 100 gas (same as Hardhat)
3. **No State Changes**: Console.log doesn't modify blockchain state
4. **Production Safety**: In production builds, console.log becomes a no-op

## Troubleshooting

### Console.log not appearing
1. Ensure your node was built with `--features dev`
2. Check that you're calling the correct address: `0x000000000000000000636F6e736F6c652e6c6f67`
3. Verify logging level includes `evm=debug`

### High gas consumption
- Each console.log uses 100 gas
- Remove console.log calls before production deployment
- Use events for production logging needs

## Advanced Usage

### Conditional Compilation

Use Hardhat's configuration to conditionally include console.sol:

```solidity
// Only include in development
// #ifdef DEVELOPMENT
import "hardhat/console.sol";
// #endif
```

### Custom Formatting

Create helper functions for consistent logging:

```solidity
function logTransaction(string memory action, address user, uint256 amount) internal view {
    console.log("=== Transaction ===");
    console.log("Action:", action);
    console.log("User:", user);
    console.log("Amount:", amount);
    console.log("Block:", block.number);
    console.log("==================");
}
```

## Example Output

When running the DebugExample contract, you'll see output like:

```
[2024-01-20 10:15:23] console.log: === updateBalance called ===
[2024-01-20 10:15:23] console.log: Caller: 0x1234...
[2024-01-20 10:15:23] console.log: Amount: 1000
[2024-01-20 10:15:23] console.log: Current balance: 0
[2024-01-20 10:15:23] console.log: Balance increased by: 1000
[2024-01-20 10:15:23] console.log: New balance: 1000
```

## License

MIT