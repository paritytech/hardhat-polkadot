import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globals: true,
        include: [
            "packages/*/test/**/*.test.ts",
            "tests/e2e/**/*.test.ts",
        ],
        testTimeout: 120000,
        hookTimeout: 120000,
        teardownTimeout: 30000,
        fileParallelism: false,
    },
})
