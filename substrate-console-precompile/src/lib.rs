#![cfg_attr(not(feature = "std"), no_std)]

//! # Console.sol Precompile for Substrate EVM
//!
//! This precompile implements Hardhat's console.sol functionality for Substrate-based
//! chains using the Frontier EVM pallet. It provides debugging capabilities for smart
//! contracts during development.
//!
//! ## Security Note
//! This precompile should ONLY be enabled in development/test environments.
//! Never enable it in production networks.

use alloy_primitives::{Address, I256, U256};
use alloy_sol_types::{sol, SolType};
use fp_evm::{
    ExitError, ExitSucceed, Precompile, PrecompileFailure, PrecompileHandle, PrecompileOutput,
    PrecompileResult,
};
use sp_core::H160;
use sp_std::{marker::PhantomData, vec::Vec};

#[cfg(not(feature = "std"))]
use thiserror_no_std::Error;
#[cfg(feature = "std")]
use thiserror::Error;

/// Console precompile address matching Hardhat's implementation
/// 0x000000000000000000636F6e736F6c652e6c6f67 = "console.log" in ASCII
pub const CONSOLE_ADDRESS: H160 = H160([
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x63, 0x6F, 0x6E, 0x73, 0x6F, 0x6C,
    0x65, 0x2E, 0x6C, 0x6F, 0x67,
]);

/// Define Solidity function signatures using alloy-sol-types
sol! {
    /// Console.log function signatures
    function log(string memory) external;
    function log(uint256) external;
    function log(bool) external;
    function log(address) external;
    function log(string memory, uint256) external;
    function log(string memory, address) external;
    function log(string memory, bool) external;
    function logInt(int256) external;
    function logBytes(bytes memory) external;
    function logBytes32(bytes32) external;
}

/// Error types for console precompile
#[derive(Debug, Error)]
pub enum ConsoleError {
    #[error("Invalid selector")]
    InvalidSelector,
    #[error("Decoding failed")]
    DecodingFailed,
    #[error("Invalid input data")]
    InvalidInput,
}

/// Console precompile implementation
pub struct ConsolePrecompile<T> {
    _phantom: PhantomData<T>,
}

impl<T> Default for ConsolePrecompile<T> {
    fn default() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }
}

impl<T> ConsolePrecompile<T> {
    /// Create a new console precompile instance
    pub fn new() -> Self {
        Self::default()
    }

    /// Process log based on function selector
    fn process_log(input: &[u8]) -> Result<(), ConsoleError> {
        if input.len() < 4 {
            return Err(ConsoleError::InvalidInput);
        }

        let selector = &input[0..4];
        let data = &input[4..];

        match selector {
            // log(string)
            [0x41, 0x30, 0x4f, 0xac] => {
                let decoded = <sol!(string)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("{}", decoded));
            }
            // log(uint256)
            [0xf5, 0xb1, 0xbb, 0xa9] => {
                let decoded = <sol!(uint256)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("{}", decoded));
            }
            // log(bool)
            [0x1e, 0x6d, 0xd4, 0xec] => {
                let decoded = <sol!(bool)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("{}", decoded));
            }
            // log(address)
            [0x2c, 0x2e, 0xcb, 0xc2] => {
                let decoded = <sol!(address)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("0x{}", alloy_primitives::hex::encode(decoded.as_slice())));
            }
            // log(string, uint256)
            [0xb6, 0x0e, 0x72, 0xcc] => {
                let decoded = <sol!(string, uint256)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("{} {}", decoded.0, decoded.1));
            }
            // log(string, address)
            [0x31, 0x9a, 0xf3, 0x33] => {
                let decoded = <sol!(string, address)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("{} 0x{}", decoded.0, alloy_primitives::hex::encode(decoded.1.as_slice())));
            }
            // log(string, bool)
            [0xc3, 0xb5, 0x56, 0x35] => {
                let decoded = <sol!(string, bool)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("{} {}", decoded.0, decoded.1));
            }
            // logInt(int256)
            [0x3f, 0x9f, 0x77, 0x1f] => {
                let decoded = <sol!(int256)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("{}", decoded));
            }
            // logBytes(bytes)
            [0xe1, 0x7b, 0xf9, 0x56] => {
                let decoded = <sol!(bytes)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("0x{}", alloy_primitives::hex::encode(decoded.as_ref())));
            }
            // logBytes32(bytes32)
            [0x27, 0xb7, 0xcf, 0x85] => {
                let decoded = <sol!(bytes32)>::abi_decode(data, true)
                    .map_err(|_| ConsoleError::DecodingFailed)?;
                Self::output_log(&format!("0x{}", alloy_primitives::hex::encode(decoded.as_slice())));
            }
            _ => {
                log::debug!("Unknown console.log selector: 0x{}", alloy_primitives::hex::encode(selector));
                return Err(ConsoleError::InvalidSelector);
            }
        }

        Ok(())
    }

    /// Output log message
    fn output_log(message: &str) {
        log::info!("console.log: {}", message);
        
        // In std environment (dev), also print to stdout
        #[cfg(feature = "std")]
        {
            println!("console.log: {}", message);
        }
        
        // Emit a Substrate event that can be captured by the RPC layer
        // This would integrate with your actual runtime's event system
        sp_io::misc::print_utf8(format!("console.log: {}", message).as_bytes());
    }
}

impl<T> Precompile for ConsolePrecompile<T> {
    fn execute(handle: &mut impl PrecompileHandle) -> PrecompileResult {
        let input = handle.input();
        
        // Process the log, ignore errors for invalid selectors
        let _ = Self::process_log(input);
        
        // Record minimal gas cost (100 gas units)
        // This matches Hardhat's implementation
        handle.record_cost(100)?;
        
        // Always return success to match Hardhat behavior
        Ok(PrecompileOutput {
            exit_status: ExitSucceed::Returned,
            output: Vec::new(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use alloy_primitives::hex;
    use proptest::prelude::*;
    use quickcheck::{quickcheck, TestResult};
    use quickcheck_macros::quickcheck;

    // Mock implementation for testing
    struct MockHandle {
        input_data: Vec<u8>,
        gas_cost: u64,
    }

    impl MockHandle {
        fn new(input: Vec<u8>) -> Self {
            Self {
                input_data: input,
                gas_cost: 0,
            }
        }
    }

    impl PrecompileHandle for MockHandle {
        fn call(
            &mut self,
            _: H160,
            _: Option<fp_evm::Transfer>,
            _: Vec<u8>,
            _: Option<u64>,
            _: bool,
            _: &fp_evm::Context,
        ) -> (fp_evm::ExitReason, Vec<u8>) {
            (fp_evm::ExitReason::Succeed(ExitSucceed::Returned), Vec::new())
        }

        fn record_cost(&mut self, cost: u64) -> Result<(), ExitError> {
            self.gas_cost += cost;
            Ok(())
        }

        fn remaining_gas(&self) -> u64 {
            1000000
        }

        fn log(&mut self, _: H160, _: Vec<sp_core::H256>, _: Vec<u8>) -> Result<(), ExitError> {
            Ok(())
        }

        fn code_address(&self) -> H160 {
            CONSOLE_ADDRESS
        }

        fn input(&self) -> &[u8] {
            &self.input_data
        }

        fn context(&self) -> &fp_evm::Context {
            &fp_evm::Context {
                address: CONSOLE_ADDRESS,
                caller: H160::zero(),
                apparent_value: sp_core::U256::zero(),
            }
        }

        fn is_static(&self) -> bool {
            false
        }

        fn gas_limit(&self) -> Option<u64> {
            Some(1000000)
        }
    }

    #[test]
    fn test_console_address_is_correct() {
        let expected = "0x000000000000000000636f6e736f6c652e6c6f67";
        let actual = format!("0x{}", hex::encode(CONSOLE_ADDRESS.as_bytes()));
        assert_eq!(actual.to_lowercase(), expected);
        
        // Verify ASCII representation
        let ascii = &CONSOLE_ADDRESS.as_bytes()[9..];
        assert_eq!(ascii, b"console.log");
    }

    #[test]
    fn test_all_selectors() {
        // Test data for each selector
        let test_cases = vec![
            // log(string)
            (
                hex!("41304fac").to_vec(),
                <sol!(string)>::abi_encode(&"test".to_string()),
            ),
            // log(uint256)
            (
                hex!("f5b1bba9").to_vec(),
                <sol!(uint256)>::abi_encode(&U256::from(42)),
            ),
            // log(bool)
            (
                hex!("1e6dd4ec").to_vec(),
                <sol!(bool)>::abi_encode(&true),
            ),
            // log(address)
            (
                hex!("2c2ecbc2").to_vec(),
                <sol!(address)>::abi_encode(&Address::ZERO),
            ),
            // log(string, uint256)
            (
                hex!("b60e72cc").to_vec(),
                <sol!(string, uint256)>::abi_encode(&("value".to_string(), U256::from(100))),
            ),
            // logInt(int256)
            (
                hex!("3f9f771f").to_vec(),
                <sol!(int256)>::abi_encode(&I256::from_raw(U256::from(1).wrapping_neg())),
            ),
        ];

        for (selector, data) in test_cases {
            let mut input = selector.clone();
            input.extend_from_slice(&data);
            
            let mut handle = MockHandle::new(input);
            let result = ConsolePrecompile::<()>::execute(&mut handle);
            
            assert!(result.is_ok(), "Failed for selector: {:?}", hex::encode(&selector));
            assert_eq!(handle.gas_cost, 100);
        }
    }

    // Property-based tests using proptest
    proptest! {
        #[test]
        fn prop_string_log_never_panics(s in ".*") {
            let selector = hex!("41304fac").to_vec();
            let data = <sol!(string)>::abi_encode(&s);
            let mut input = selector;
            input.extend_from_slice(&data);
            
            let result = ConsolePrecompile::<()>::process_log(&input);
            // Should never panic, only return Ok or Err
            let _ = result;
        }

        #[test]
        fn prop_uint256_log_never_panics(n: u128) {
            let selector = hex!("f5b1bba9").to_vec();
            let value = U256::from(n);
            let data = <sol!(uint256)>::abi_encode(&value);
            let mut input = selector;
            input.extend_from_slice(&data);
            
            let result = ConsolePrecompile::<()>::process_log(&input);
            assert!(result.is_ok());
        }

        #[test]
        fn prop_random_input_never_panics(input: Vec<u8>) {
            let result = ConsolePrecompile::<()>::process_log(&input);
            // Should handle any input gracefully
            let _ = result;
        }

        #[test]
        fn prop_gas_cost_is_always_100(input: Vec<u8>) {
            let mut handle = MockHandle::new(input);
            let _ = ConsolePrecompile::<()>::execute(&mut handle);
            // Gas cost should always be 100 regardless of input
            prop_assert_eq!(handle.gas_cost, 100);
        }
    }

    // QuickCheck property tests
    #[quickcheck]
    fn qc_bool_log_roundtrip(value: bool) -> TestResult {
        let selector = hex!("1e6dd4ec").to_vec();
        let data = <sol!(bool)>::abi_encode(&value);
        let mut input = selector;
        input.extend_from_slice(&data);
        
        let result = ConsolePrecompile::<()>::process_log(&input);
        TestResult::from_bool(result.is_ok())
    }

    #[quickcheck]
    fn qc_address_log_valid(bytes: [u8; 20]) -> TestResult {
        let selector = hex!("2c2ecbc2").to_vec();
        let addr = Address::from_slice(&bytes);
        let data = <sol!(address)>::abi_encode(&addr);
        let mut input = selector;
        input.extend_from_slice(&data);
        
        let result = ConsolePrecompile::<()>::process_log(&input);
        TestResult::from_bool(result.is_ok())
    }

    #[quickcheck]
    fn qc_execution_always_succeeds(input: Vec<u8>) -> bool {
        let mut handle = MockHandle::new(input);
        let result = ConsolePrecompile::<()>::execute(&mut handle);
        
        // Should always return Ok with Succeeded status
        matches!(result, Ok(output) if output.exit_status == ExitSucceed::Returned)
    }

    #[test]
    fn test_edge_cases() {
        // Empty input
        assert!(ConsolePrecompile::<()>::process_log(&[]).is_err());
        
        // Invalid selector
        assert!(ConsolePrecompile::<()>::process_log(&[0xff, 0xff, 0xff, 0xff]).is_err());
        
        // Valid selector but no data
        let result = ConsolePrecompile::<()>::process_log(&hex!("41304fac"));
        assert!(result.is_err()); // Should fail to decode
        
        // Malformed ABI data
        let mut input = hex!("41304fac").to_vec();
        input.extend_from_slice(&[0xff; 10]); // Invalid ABI encoding
        assert!(ConsolePrecompile::<()>::process_log(&input).is_err());
    }

    // Benchmark-style test to ensure performance
    #[test]
    #[cfg(feature = "std")]
    fn test_performance_baseline() {
        let selector = hex!("f5b1bba9").to_vec();
        let data = <sol!(uint256)>::abi_encode(&U256::from(42));
        let mut input = selector;
        input.extend_from_slice(&data);
        
        let start = std::time::Instant::now();
        for _ in 0..1000 {
            let mut handle = MockHandle::new(input.clone());
            let _ = ConsolePrecompile::<()>::execute(&mut handle);
        }
        let elapsed = start.elapsed();
        
        // Should process 1000 logs in under 100ms
        assert!(elapsed.as_millis() < 100, "Performance regression detected: {}ms", elapsed.as_millis());
    }
}