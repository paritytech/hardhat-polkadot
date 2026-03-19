# Migration Plan: hardhat-polkadot → Hardhat v3 Compatibility

## Context

The `hardhat-polkadot` plugin (4 packages) currently targets Hardhat v2 (`hardhat@^2.26.0`). Hardhat v3 replaces the entire plugin API:

- `extendConfig`/`extendEnvironment` → hook handlers (`config`, `hre`, `solidity`, `network`)
- `task()`/`subtask()` → `task()`/`overrideTask()` builders with lazy action imports
- `declare module "hardhat/types"` → `declare module "hardhat/types/*.js"`
- Many `hardhat/internal/*` imports are removed or relocated to `@nomicfoundation/hardhat-utils` and `@nomicfoundation/hardhat-errors`

The plugin uses **20+ internal Hardhat APIs** (HardhatContext, Environment, createProvider, CompilerPlatform, Artifacts class, etc.) that are all breaking changes. The goal is to migrate to v3's public API surface while preserving all existing functionality.

Each PR below is **self-contained, compilable, and testable** at merge time. The Hardhat v3 source is at `../hardhat` (specifically `../hardhat/v-next/hardhat/`).

---

## Hardhat v3 Plugin API Cheat Sheet

### Plugin definition
```ts
import type { HardhatPlugin } from "hardhat/types/plugins";

const plugin: HardhatPlugin = {
  id: "my-plugin",
  npmPackage: "@my-org/my-plugin",
  dependencies: () => [import("other-plugin")],
  hookHandlers: {
    config: () => import("./hook-handlers/config.js"),
    hre: () => import("./hook-handlers/hre.js"),
    solidity: () => import("./hook-handlers/solidity.js"),
    network: () => import("./hook-handlers/network.js"),
  },
  tasks: [/* task definitions */],
  globalOptions: [/* global option definitions */],
};
export default plugin;
```

### Config hooks (`hook-handlers/config.ts`)
```ts
export default async () => ({
  extendUserConfig: async (config, next) => {
    return next({ ...config, myField: { ...defaults, ...config.myField } });
  },
  validateUserConfig: async (config) => {
    // return HardhatUserConfigValidationError[]
    return [];
  },
  resolveUserConfig: async (userConfig, resolveConfigVariable, next) => {
    const resolved = await next(userConfig, resolveConfigVariable);
    return { ...resolved, myField: resolveMyConfig(userConfig) };
  },
});
```

### HRE hooks (`hook-handlers/hre.ts`)
```ts
export default async () => ({
  created: async (_context, hre) => {
    // Attach things to hre, read hre.config, etc.
  },
});
```

### Solidity hooks (`hook-handlers/solidity.ts`)
The v3 solidity plugin exposes these hooks (defined in `SolidityHooks`):
- **`invokeSolc(context, compiler, solcInput, solcConfig, next)`** — intercept compiler invocation
- **`preprocessSolcInputBeforeBuilding(context, solcInput, next)`** — modify solc input JSON
- **`preprocessProjectFileBeforeBuilding(context, inputSourceName, fsPath, fileContent, solcVersion, next)`** — modify individual files
- **`build(context, rootFilePaths, options, next)`** — wrap entire build
- **`onCleanUpArtifacts(context, artifactPaths, next)`** — post-build cleanup
- **`readSourceFile(context, absolutePath, next)`** — intercept file reads

### Network hooks (`hook-handlers/network.ts`)
- **`newConnection(context, next)`** — intercept network connection creation
- **`closeConnection(context, networkConnection, next)`** — intercept connection close
- **`onRequest(context, networkConnection, jsonRpcRequest, next)`** — intercept JSON-RPC requests

### Task definitions
```ts
import { task, overrideTask, emptyTask } from "hardhat/config";

// New task
task("my-task", "Description")
  .addOption({ name: "port", type: ArgumentType.INT, defaultValue: 8545 })
  .addFlag({ name: "verbose", description: "Verbose output" })
  .setAction(async () => import("./task-actions/my-task.js"))
  .build()

// Override existing task
overrideTask("test")
  .setAction(async () => import("./task-actions/test.js"))
  .build()

// Task action (override)
// task-actions/test.ts
const action: TaskOverrideActionFunction = async (args, hre, runSuper) => {
  // before
  const result = await runSuper(args);
  // after
  return result;
};
export default action;
```

### Type extensions
```ts
// Use .js extension in module paths
declare module "hardhat/types/config.js" {
  interface HardhatUserConfig { myField?: MyUserConfig; }
  interface HardhatConfig { myField: MyConfig; }
  // v3 network types: EdrNetworkUserConfig (replaces HardhatNetworkUserConfig), HttpNetworkUserConfig
  interface EdrNetworkUserConfig { myProp?: boolean; }
  interface HttpNetworkUserConfig { myProp?: boolean; }
}
declare module "hardhat/types/hre.js" {
  interface HardhatRuntimeEnvironment { myManager: MyManager; }
}
```

### Internal API replacements
| v2 import | v3 replacement |
|---|---|
| `hardhat/internal/artifacts` `Artifacts` class | `hre.artifacts` (ArtifactManager interface) |
| `hardhat/internal/util/global-dir` `getCompilersDir()` | `@nomicfoundation/hardhat-utils/global-dir` |
| `hardhat/internal/solidity/compiler/downloader` `CompilerPlatform` | Define locally (just an enum of 4 strings) |
| `hardhat/internal/core/errors` `assertHardhatInvariant()` | `@nomicfoundation/hardhat-errors` |
| `hardhat/internal/util/global-dir` `MultiProcessMutex` | `@nomicfoundation/hardhat-utils/synchronization` |
| `hardhat/plugins` `HardhatPluginError` | Same path works in v3 (also in `hardhat/config`) |
| `hardhat/internal/core/runtime-environment` `HardhatContext` | Not needed — v3 manages HRE internally |
| `hardhat/internal/core/runtime-environment` `Environment` | Not needed — use HRE from hooks |
| `hardhat/internal/core/providers/construction` `createProvider()` | `hre.network.connect()` / `hre.network.createServer()` |
| `hardhat/internal/core/providers` `LazyInitializationProviderAdapter` | Not needed — v3 connections are lazy |
| `loadConfigAndTasks()` | Not needed — config loaded by framework |
| `getEnvHardhatArguments()`, `HARDHAT_PARAM_DEFINITIONS` | Not needed |
| `loadTsNode()`, `willRunWithTypescript()` | Not needed — v3 handles TS natively |
| `HARDHAT_NETWORK_NAME` | Hardcode `"hardhat"` or define constant |
| `hardhat/builtin-tasks/task-names` | No longer exists — tasks defined in plugin |

---

## PR 1 — Infrastructure: ESM, dependencies, and package scaffolding

**Goal:** Get the monorepo building against Hardhat v3 with the new module system.

**Changes:**
- Update root `package.json` and all 4 package `package.json` files:
  - Peer dependency `hardhat@^2.26.0` → `hardhat@^3.0.0`
  - Add `@nomicfoundation/hardhat-errors` and `@nomicfoundation/hardhat-utils` dependencies
  - Remove imports from `hardhat/builtin-tasks/task-names` (no longer exists)
- Update all `tsconfig.json` files:
  - `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
  - Add `.js` extensions to all relative imports (required for ESM)
- Convert each package's main entry to export a `default` `HardhatPlugin` object (stubbed initially)
- Ensure `tsc --build .` passes with no errors (even if plugin logic is stubbed)

**Files:**
- `package.json` (root + all 4 packages)
- `tsconfig.json` (root + all 4 packages)
- Every `.ts` file (add `.js` to relative imports)
- `packages/hardhat-polkadot/src/index.ts` — stub plugin export
- `packages/hardhat-polkadot-resolc/src/index.ts` — stub plugin export
- `packages/hardhat-polkadot-node/src/index.ts` — stub plugin export

---

## PR 2 — Type extensions: migrate module augmentation paths ✅ DONE

**Goal:** Update all `declare module` blocks to v3 paths and interfaces.

**NOTE:** Hardhat v3 exports map keys do NOT include `.js` extensions (e.g. `"./types/config"` not `"./types/config.js"`).
With `moduleResolution: "NodeNext"`, package imports must match the exports map keys exactly, so use
`"hardhat/types/config"` and `"hardhat/types/solidity"` (no `.js` suffix) for both imports and `declare module` paths.

**Changes completed:**
- `packages/hardhat-polkadot-resolc/src/type-extensions.ts`:
  - `HardhatNetworkUserConfig`/`HardhatNetworkConfig` → `EdrNetworkUserConfig`/`EdrNetworkConfig`
  - Removed `NetworksConfig` augmentation (doesn't exist in v3)
- `packages/hardhat-polkadot-node/src/type-extensions.ts`:
  - `HardhatNetworkUserConfig`/`HardhatNetworkConfig` → `EdrNetworkUserConfig`/`EdrNetworkConfig`
  - Removed `declare module "hardhat/types/runtime"` block (no runtime module in v3)
- `packages/hardhat-polkadot-resolc/src/types.ts`:
  - `CompilerInput` from `hardhat/types/solidity`, `SolcConfig` from `hardhat/types/config`
- `packages/hardhat-polkadot-node/src/types.ts`:
  - `HardhatNetworkUserConfig` → `EdrNetworkUserConfig` from `hardhat/types/config`
- Also updated all other files referencing old types:
  - `rpc-server.ts`, `utils.ts`, `factory-support.ts`, `compile/binary.ts`, `compile/npm.ts`, `compile/index.ts`, `resolc/utils.ts`

**Files:**
- `packages/hardhat-polkadot-resolc/src/type-extensions.ts`
- `packages/hardhat-polkadot-node/src/type-extensions.ts`
- `packages/hardhat-polkadot-resolc/src/types.ts`
- `packages/hardhat-polkadot-node/src/types.ts`
- `packages/hardhat-polkadot-resolc/src/compile/binary.ts`
- `packages/hardhat-polkadot-resolc/src/compile/npm.ts`
- `packages/hardhat-polkadot-resolc/src/compile/index.ts`
- `packages/hardhat-polkadot-resolc/src/utils.ts`
- `packages/hardhat-polkadot-node/src/rpc-server.ts`
- `packages/hardhat-polkadot-node/src/utils.ts`
- `packages/hardhat-polkadot-node/src/core/factory-support.ts`

---

## PR 3 — resolc: plugin definition + config hooks

**Goal:** Replace `extendConfig()` and config validation with v3 hook handlers.

**Current v2 pattern** (`packages/hardhat-polkadot-resolc/src/index.ts:54-84`):
```ts
extendConfig((config, userConfig) => {
  config.resolc = { ...defaults, ...userConfig.resolc };
  // validate polkadot network flag
});
extendEnvironment((hre) => {
  // set hre.network.polkadot, reinitialize artifacts
});
```

**New v3 pattern:**
- Create `packages/hardhat-polkadot-resolc/src/hook-handlers/config.ts`:
  - `extendUserConfig` — merge resolc defaults into user config
  - `validateUserConfig` — validate resolc config shape (use Zod or manual)
  - `resolveUserConfig` — call `next()`, then attach resolved `resolc` to config
- Create `packages/hardhat-polkadot-resolc/src/hook-handlers/hre.ts`:
  - `created` hook — set polkadot flag on network, any HRE setup
- Update plugin definition in `index.ts`:
  ```ts
  const plugin: HardhatPlugin = {
    id: "hardhat-polkadot-resolc",
    hookHandlers: {
      config: () => import("./hook-handlers/config.js"),
      hre: () => import("./hook-handlers/hre.js"),
    },
    tasks: [], // added in PR 4
  };
  export default plugin;
  ```
- Remove `extendConfig()` and `extendEnvironment()` calls

**Files:**
- `packages/hardhat-polkadot-resolc/src/index.ts` — rewrite as plugin definition
- `packages/hardhat-polkadot-resolc/src/hook-handlers/config.ts` (new)
- `packages/hardhat-polkadot-resolc/src/hook-handlers/hre.ts` (new)

---

## PR 4 — resolc: compilation via `invokeSolc` hook

**Goal:** Replace the 13 subtask overrides with v3's `SolidityHooks`.

**Current v2 approach:** Overrides ~13 subtasks (`TASK_COMPILE_SOLIDITY_RUN_SOLC`, `TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT`, `TASK_COMPILE_SOLIDITY_COMPILE_SOLC`, etc.) to route compilation through the Revive compiler.

**New v3 approach:** The solidity plugin exposes hooks in `SolidityHooks`:
- **`invokeSolc`** — intercept compiler invocation, run Revive instead of solc when `polkadot` is enabled
- **`preprocessSolcInputBeforeBuilding`** — transform compiler input (add `suppressedWarnings`, modify settings)
- **`onCleanUpArtifacts`** — post-process artifacts if needed
- **`build`** — wrap entire build if needed (for logging, size checks)

**Changes:**
- Create `packages/hardhat-polkadot-resolc/src/hook-handlers/solidity.ts`:
  - `invokeSolc` handler: check if polkadot target → run Revive compiler (`BinaryCompiler` or `NpmCompiler`), otherwise call `next()`
  - `preprocessSolcInputBeforeBuilding` handler: inject resolc-specific settings into solc input
  - `build` handler (optional): wrap with logging, size-check patch
- Move compilation logic from current subtask actions into hook handler functions
- Keep `BinaryCompiler`, `NpmCompiler`, `ResolcCompilerDownloader` classes mostly as-is (they don't depend on Hardhat APIs directly)
- Update plugin definition to register `solidity` hook handlers:
  ```ts
  hookHandlers: {
    config: () => import("./hook-handlers/config.js"),
    hre: () => import("./hook-handlers/hre.js"),
    solidity: () => import("./hook-handlers/solidity.js"),
  },
  ```
- Remove all `subtask()` and `task(TASK_COMPILE, ...)` calls from `index.ts`

**Files:**
- `packages/hardhat-polkadot-resolc/src/hook-handlers/solidity.ts` (new)
- `packages/hardhat-polkadot-resolc/src/index.ts` — remove subtask/task overrides
- `packages/hardhat-polkadot-resolc/src/compile/binary.ts` — minor type updates
- `packages/hardhat-polkadot-resolc/src/compile/npm.ts` — minor type updates

---

## PR 5 — resolc: replace internal Hardhat imports

**Goal:** Remove all `hardhat/internal/*` imports from the resolc package.

**Replacements:**

| Current import | v3 replacement |
|---|---|
| `Artifacts` class from `hardhat/internal/artifacts` | Use `hre.artifacts` (`ArtifactManager` interface) — pass through hook context |
| `getCompilersDir()` from `hardhat/internal/util/global-dir` | `@nomicfoundation/hardhat-utils/global-dir` |
| `CompilerPlatform` from `hardhat/internal/solidity/compiler/downloader` | Define own `CompilerPlatform` enum locally (it's just 4 strings: `linux-amd64`, `linux-arm64`, `windows-amd64`, `macosx-amd64`, `wasm`) |
| `assertHardhatInvariant()` from `hardhat/internal/core/errors` | `@nomicfoundation/hardhat-errors` (exported publicly) |
| `MultiProcessMutex` from `hardhat/internal/util/global-dir` | `@nomicfoundation/hardhat-utils/synchronization` |
| `HardhatPluginError` from `hardhat/plugins` | Same import path works in v3 (also available from `hardhat/config`) |

**Files:**
- `packages/hardhat-polkadot-resolc/src/downloader.ts` — replace `CompilerPlatform`, `MultiProcessMutex`, `getCompilersDir`
- `packages/hardhat-polkadot-resolc/src/index.ts` — replace `Artifacts` usage
- `packages/hardhat-polkadot-resolc/src/errors.ts` — update `HardhatPluginError` import if needed
- `packages/hardhat-polkadot-resolc/src/constants.ts` — add local `CompilerPlatform` enum

---

## PR 6 — node: plugin definition + config hooks

**Goal:** Convert `hardhat-polkadot-node` to a v3 plugin with config hooks.

**Changes:**
- Create `packages/hardhat-polkadot-node/src/hook-handlers/config.ts`:
  - `extendUserConfig` — inject default nodeConfig/adapterConfig
  - `validateUserConfig` — validate node/adapter/docker config
  - `resolveUserConfig` — resolve node config (ports, paths, etc.)
- Create `packages/hardhat-polkadot-node/src/hook-handlers/hre.ts`:
  - `created` hook — set polkadot flag, polkadotUrl on network config
- Update plugin definition:
  ```ts
  const plugin: HardhatPlugin = {
    id: "hardhat-polkadot-node",
    dependencies: () => [
      import("hardhat/internal/builtin-plugins/network-manager/index.js"),
      import("hardhat/internal/builtin-plugins/node/index.js"),
    ],
    hookHandlers: {
      config: () => import("./hook-handlers/config.js"),
      hre: () => import("./hook-handlers/hre.js"),
      network: () => import("./hook-handlers/network.js"), // PR 7
    },
    tasks: [], // added in PR 8
  };
  ```

**Files:**
- `packages/hardhat-polkadot-node/src/index.ts` — rewrite as plugin definition
- `packages/hardhat-polkadot-node/src/hook-handlers/config.ts` (new)
- `packages/hardhat-polkadot-node/src/hook-handlers/hre.ts` (new)

---

## PR 7 — node: network hooks + replace internal APIs

**Goal:** Replace `createProvider`, `HardhatContext`, `Environment`, `LazyInitializationProviderAdapter`, and the global interceptor pattern with v3 network hooks.

**Current v2 approach:**
- `register.ts` — manually creates `HardhatContext`, loads config, instantiates `Environment`, calls `createProvider()`, `injectToGlobal()`
- `global-interceptor.ts` — accesses `global.__hardhatContext.tasksDSL` to dynamically re-register tasks with wrappers
- `utils.ts` — calls `createProvider()` from `hardhat/internal/core/providers`

**New v3 approach:**
- Create `packages/hardhat-polkadot-node/src/hook-handlers/network.ts`:
  - `newConnection` hook — when connecting to a polkadot network, start local node services (SubstrateNode + EthRpc), configure provider to point at local adapter
  - `closeConnection` hook — stop services on connection close
  - `onRequest` hook (optional) — intercept/forward RPC requests if needed
- **Delete** `register.ts` and `global-interceptor.ts` entirely (these are v2-only patterns)
- **Delete** `script-runner.ts` (v3 handles script execution differently)
- Update `utils.ts` — remove `createProvider()` import, use `hre.network.connect()` instead

**Files:**
- `packages/hardhat-polkadot-node/src/hook-handlers/network.ts` (new)
- `packages/hardhat-polkadot-node/src/core/register.ts` — **delete**
- `packages/hardhat-polkadot-node/src/core/global-interceptor.ts` — **delete**
- `packages/hardhat-polkadot-node/src/core/script-runner.ts` — **delete**
- `packages/hardhat-polkadot-node/src/utils.ts` — remove internal imports
- `packages/hardhat-polkadot-node/src/errors.ts` — update error imports

---

## PR 8 — node: task definitions (node, test, run overrides)

**Goal:** Migrate task overrides from v2 `task(TASK_NAME).setAction(...)` to v3 `overrideTask()` builders.

**Current v2 tasks:**
- `task(TASK_RUN)` — wraps run with node lifecycle
- `task(TASK_NODE)` — wraps node startup for polkadot
- `task(TASK_TEST)` — wraps test with node lifecycle + factory dependencies
- `task(TASK_NODE_POLKADOT)` — custom task to start polkadot node
- `subtask(TASK_NODE_POLKADOT_CREATE_SERVER)` — creates RPC server
- `subtask(TASK_RUN_POLKADOT_NODE_IN_SEPARATE_PROCESS)` — spawns node process
- `scope("ignition").task("deploy")` — ignition compatibility

**New v3 tasks:**
```ts
tasks: [
  overrideTask("test")
    .setAction(async () => import("./task-actions/test.js"))
    .build(),

  overrideTask("run")
    .setAction(async () => import("./task-actions/run.js"))
    .build(),

  overrideTask("node")
    .setAction(async () => import("./task-actions/node.js"))
    .build(),

  task("node-polkadot", "Start a Polkadot JSON-RPC server")
    .setAction(async () => import("./task-actions/node-polkadot.js"))
    .build(),
],
```

**Task action pattern (v3):**
```ts
// task-actions/test.ts
import type { TaskOverrideActionFunction } from "hardhat/types/tasks";

const testAction: TaskOverrideActionFunction = async (args, hre, runSuper) => {
  if (!isPolkadotNetwork(hre)) return runSuper(args);
  const server = await createRpcServer(hre.config);
  await server.listen(...);
  try {
    await handleFactoryDependencies(hre);
    return await runSuper(args);
  } finally {
    await server.stop();
  }
};
export default testAction;
```

**Files:**
- `packages/hardhat-polkadot-node/src/index.ts` — add task definitions to plugin
- `packages/hardhat-polkadot-node/src/task-actions/test.ts` (new)
- `packages/hardhat-polkadot-node/src/task-actions/run.ts` (new)
- `packages/hardhat-polkadot-node/src/task-actions/node.ts` (new)
- `packages/hardhat-polkadot-node/src/task-actions/node-polkadot.ts` (new)
- Keep `packages/hardhat-polkadot-node/src/rpc-server.ts` and service classes mostly unchanged

---

## PR 9 — Umbrella plugin + migrator update

**Goal:** Update the main `@parity/hardhat-polkadot` umbrella package and the migrator.

**Umbrella (`packages/hardhat-polkadot`):**
- Update `src/index.ts` to export a combined `HardhatPlugin`:
  ```ts
  const plugin: HardhatPlugin = {
    id: "hardhat-polkadot",
    dependencies: () => [
      import("@parity/hardhat-polkadot-resolc"),
      import("@parity/hardhat-polkadot-node"),
    ],
    // May include own hooks (e.g., size check patch via solidity build hook)
  };
  export default plugin;
  ```
- Update `sizeCheckPatch()` to work with v3 artifact format
- Update CLI (`src/cli/`) if it references v2 config patterns

**Migrator (`packages/hardhat-polkadot-migrator`):**
- Update jscodeshift transforms to generate v3-compatible config:
  - `import plugin from "@parity/hardhat-polkadot"` (ESM default import)
  - `plugins: [plugin]` in config (v3 pattern)
  - `defineConfig()` wrapper
- Update version checks for Hardhat v3

**Files:**
- `packages/hardhat-polkadot/src/index.ts`
- `packages/hardhat-polkadot/src/cli/` — update templates
- `packages/hardhat-polkadot-migrator/src/index.ts`
- `packages/hardhat-polkadot-migrator/src/transforms/`

---

## PR 10 — Examples + tests update

**Goal:** Update all example projects and tests to use v3 config format.

**Example configs (8 projects in `examples/`):**
```ts
// v3 config format
import { defineConfig } from "hardhat/config";
import polkadot from "@parity/hardhat-polkadot";

export default defineConfig({
  plugins: [polkadot],
  solidity: "0.8.28",
  networks: {
    hardhat: { polkadot: true, nodeConfig: { ... } },
  },
  resolc: { version: "0.5.0" },
});
```
- Remove `require("@parity/hardhat-polkadot")` / `import "@parity/hardhat-polkadot"` side-effect style imports
- Update any test helpers that reference v2 APIs

**Tests:**
- Update fixture projects in `tests/fixture-projects/`
- Update test scripts in `tests/` if they rely on v2 task names or output
- Ensure `tests/run.sh` still works

**Files:**
- `examples/*/hardhat.config.ts` (8 files)
- `tests/fixture-projects/*/hardhat.config.ts`
- `tests/helpers.sh` — if referencing v2 patterns
- `tests/e2e/*.test.sh` and `tests/unit/*.test.sh`

---

## Verification

After all PRs are merged:

1. **Build check:** `pnpm build` succeeds with no TS errors
2. **Unit tests:** `cd tests && bash run.sh unit` passes
3. **E2E tests:** `cd tests && bash run.sh e2e` passes — compilation, local node, deployment, and test all work
4. **Manual smoke test:** Create a new project with `hardhat-polkadot init`, compile a contract, run tests against local polkadot node
5. **Example projects:** Each example in `examples/` compiles and runs successfully

---

## Current v2 API Usage Inventory

This is a complete list of every Hardhat v2 API the plugin uses, for reference during migration.

### Config extension APIs (`hardhat/config`)
- `extendConfig()` — `packages/hardhat-polkadot-resolc/src/index.ts:54`
- `extendEnvironment()` — `packages/hardhat-polkadot-resolc/src/index.ts:86`

### Task/subtask definitions (`hardhat/config`)
- `task(TASK_COMPILE)` — `packages/hardhat-polkadot-resolc/src/index.ts:120`
- `task(TASK_RUN)` — `packages/hardhat-polkadot-node/src/index.ts:41`
- `task(TASK_NODE)` — `packages/hardhat-polkadot-node/src/index.ts:86`
- `task(TASK_TEST)` — `packages/hardhat-polkadot-node/src/index.ts:144`
- `task(TASK_NODE_POLKADOT)` — `packages/hardhat-polkadot-node/src/index.ts:95`
- `scope("ignition").task("deploy")` — `packages/hardhat-polkadot-node/src/index.ts:263`
- `subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_NAMES)` — `packages/hardhat-polkadot-resolc/src/index.ts:131`
- `subtask(TASK_COMPILE_SOLIDITY_GET_ARTIFACT_FROM_COMPILATION_OUTPUT)` — `packages/hardhat-polkadot-resolc/src/index.ts:155`
- `subtask(TASK_COMPILE_SOLIDITY_RUN_SOLC)` — `packages/hardhat-polkadot-resolc/src/index.ts:193`
- `subtask(TASK_COMPILE_SOLIDITY_RUN_RESOLC)` — `packages/hardhat-polkadot-resolc/src/index.ts:215`
- `subtask(TASK_COMPILE_SOLIDITY_COMPILE_RESOLC)` — `packages/hardhat-polkadot-resolc/src/index.ts:248`
- `subtask(TASK_COMPILE_SOLIDITY_COMPILE_SOLC)` — `packages/hardhat-polkadot-resolc/src/index.ts:298`
- `subtask(TASK_COMPILE_SOLIDITY_LOG_DOWNLOAD_RESOLC_COMPILER_START)` — `packages/hardhat-polkadot-resolc/src/index.ts:323`
- `subtask(TASK_COMPILE_SOLIDITY_GET_RESOLC_BUILD)` — `packages/hardhat-polkadot-resolc/src/index.ts:340`
- `subtask(TASK_COMPILE_SOLIDITY_LOG_COMPILATION_RESULT)` — `packages/hardhat-polkadot-resolc/src/index.ts:421`
- `subtask(TASK_COMPILE_SOLIDITY_LOG_RUN_COMPILER_START)` — `packages/hardhat-polkadot-resolc/src/index.ts:437`
- `subtask(TASK_COMPILE_SOLIDITY_EMIT_ARTIFACTS)` — `packages/hardhat-polkadot-resolc/src/index.ts:452`
- `subtask(TASK_COMPILE_SOLIDITY_GET_COMPILER_INPUT)` — `packages/hardhat-polkadot-resolc/src/index.ts:524`
- `subtask(TASK_NODE_POLKADOT_CREATE_SERVER)` — `packages/hardhat-polkadot-node/src/index.ts:60`
- `subtask(TASK_RUN_POLKADOT_NODE_IN_SEPARATE_PROCESS)` — `packages/hardhat-polkadot-node/src/index.ts:125`

### Internal API imports
- `Artifacts` class — `hardhat/internal/artifacts` — used in resolc `index.ts` and node `register.ts`
- `getCompilersDir()` — `hardhat/internal/util/global-dir` — used in resolc `index.ts`
- `CompilerPlatform` enum — `hardhat/internal/solidity/compiler/downloader` — used in resolc `index.ts`, `types.ts`, `download.ts`, `downloader.ts`
- `assertHardhatInvariant()` — `hardhat/internal/core/errors` — used in resolc `index.ts`, `downloader.ts`
- `MultiProcessMutex` — `hardhat/internal/util/global-dir` — used in resolc `downloader.ts`
- `HardhatContext` — `hardhat/internal/core/runtime-environment` — used in node `register.ts`
- `Environment` class — `hardhat/internal/core/runtime-environment` — used in node `register.ts`, `global-interceptor.ts`
- `createProvider()` — `hardhat/internal/core/providers/construction` — used in node `utils.ts`, `register.ts`
- `LazyInitializationProviderAdapter` — `hardhat/internal/core/providers` — used in node `register.ts`
- `loadConfigAndTasks()` — `hardhat/internal/core/config/config-loading` — used in node `register.ts`
- `getEnvHardhatArguments()` — `hardhat/internal/core/params/env-variables` — used in node `register.ts`
- `HARDHAT_PARAM_DEFINITIONS` — `hardhat/internal/core/params/hardhat-params` — used in node `register.ts`
- `loadTsNode()` / `willRunWithTypescript()` — `hardhat/internal/core/typescript-support` — used in node `register.ts`
- `getEnvVariablesMap()` — `hardhat/internal/core/params/env-variables` — used in node `script-runner.ts`
- `isRunningHardhatCoreTests()` — `hardhat/internal/core/execution-mode` — used in node `script-runner.ts`
- `disableReplWriterShowProxy()` / `isNodeCalledWithoutAScript()` — `hardhat/internal/util/console` — used in node `register.ts`
- `GlobalWithHardhatContext` — `hardhat/internal/context` — used in node `global-interceptor.ts`

### Type extensions (declare module)
- `packages/hardhat-polkadot-resolc/src/type-extensions.ts` — augments `hardhat/types/config` and `hardhat/types/runtime`
- `packages/hardhat-polkadot-node/src/type-extensions.ts` — augments `hardhat/types/config` and `hardhat/types/runtime`

### Built-in task name constants (`hardhat/builtin-tasks/task-names`)
All `TASK_*` constants imported in resolc and node `index.ts` files — this module does not exist in v3.
