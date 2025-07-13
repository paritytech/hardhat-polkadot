# Sample Polkadot Hardhat Project with PolkaVM Networks

This project demonstrates how to use Hardhat with Polkadot using forking capabilities. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

## Quick Start

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Download required binaries:**
   ```bash
   chmod +x ./setup-binaries.sh
   ./setup-binaries.sh
   ```

### Compile and Test

1. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

2. **Run tests:**
   ```bash
   npx hardhat test
   ```

3. **Start local node:**
   ```bash
   npx hardhat node
   ```

4. **Deploy contract:**
   ```bash
   npx hardhat ignition deploy ./ignition/modules/Greeter.ts --network localhost
   ```

## Resources

- [Polkadot Hardhat Documentation](https://papermoonio.github.io/polkadot-mkdocs/develop/smart-contracts/dev-environments/hardhat/)
- [eth-rpc-adapter](https://github.com/paritytech/polkadot-sdk/tree/master/substrate/frame/revive/rpc)
- [Substrate Node](https://github.com/paritytech/polkadot-sdk)
