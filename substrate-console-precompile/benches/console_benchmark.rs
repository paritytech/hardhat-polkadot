use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use pallet_evm_precompile_console::{ConsolePrecompile, CONSOLE_ADDRESS};
use alloy_primitives::{Address, U256, I256};
use alloy_sol_types::{sol, SolType};
use fp_evm::{ExitError, ExitSucceed, PrecompileHandle, PrecompileOutput, Context};
use sp_core::H160;

// Mock handle for benchmarking
struct BenchHandle {
    input_data: Vec<u8>,
    gas_cost: u64,
}

impl BenchHandle {
    fn new(input: Vec<u8>) -> Self {
        Self {
            input_data: input,
            gas_cost: 0,
        }
    }
}

impl PrecompileHandle for BenchHandle {
    fn call(
        &mut self,
        _: H160,
        _: Option<fp_evm::Transfer>,
        _: Vec<u8>,
        _: Option<u64>,
        _: bool,
        _: &Context,
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

    fn context(&self) -> &Context {
        &Context {
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

fn benchmark_string_log(c: &mut Criterion) {
    let mut group = c.benchmark_group("console_log_string");
    
    for size in [10, 100, 1000].iter() {
        let string = "a".repeat(*size);
        let selector = hex_literal::hex!("41304fac").to_vec();
        let data = <sol!(string)>::abi_encode(&string);
        let mut input = selector;
        input.extend_from_slice(&data);
        
        group.bench_with_input(BenchmarkId::from_parameter(size), &input, |b, input| {
            b.iter(|| {
                let mut handle = BenchHandle::new(input.clone());
                ConsolePrecompile::<()>::execute(black_box(&mut handle))
            });
        });
    }
    group.finish();
}

fn benchmark_uint256_log(c: &mut Criterion) {
    c.bench_function("console_log_uint256", |b| {
        let selector = hex_literal::hex!("f5b1bba9").to_vec();
        let data = <sol!(uint256)>::abi_encode(&U256::from(42));
        let mut input = selector;
        input.extend_from_slice(&data);
        
        b.iter(|| {
            let mut handle = BenchHandle::new(input.clone());
            ConsolePrecompile::<()>::execute(black_box(&mut handle))
        });
    });
}

fn benchmark_address_log(c: &mut Criterion) {
    c.bench_function("console_log_address", |b| {
        let selector = hex_literal::hex!("2c2ecbc2").to_vec();
        let data = <sol!(address)>::abi_encode(&Address::ZERO);
        let mut input = selector;
        input.extend_from_slice(&data);
        
        b.iter(|| {
            let mut handle = BenchHandle::new(input.clone());
            ConsolePrecompile::<()>::execute(black_box(&mut handle))
        });
    });
}

fn benchmark_complex_log(c: &mut Criterion) {
    c.bench_function("console_log_string_uint256", |b| {
        let selector = hex_literal::hex!("b60e72cc").to_vec();
        let data = <sol!(string, uint256)>::abi_encode(&("test value".to_string(), U256::from(100)));
        let mut input = selector;
        input.extend_from_slice(&data);
        
        b.iter(|| {
            let mut handle = BenchHandle::new(input.clone());
            ConsolePrecompile::<()>::execute(black_box(&mut handle))
        });
    });
}

fn benchmark_invalid_input(c: &mut Criterion) {
    c.bench_function("console_log_invalid", |b| {
        let input = vec![0xff, 0xff, 0xff, 0xff];
        
        b.iter(|| {
            let mut handle = BenchHandle::new(input.clone());
            ConsolePrecompile::<()>::execute(black_box(&mut handle))
        });
    });
}

criterion_group!(
    benches,
    benchmark_string_log,
    benchmark_uint256_log,
    benchmark_address_log,
    benchmark_complex_log,
    benchmark_invalid_input
);
criterion_main!(benches);