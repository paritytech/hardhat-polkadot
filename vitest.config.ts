import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globals: true,
        include: [
            "packages/*/test/**/*.test.ts",
            "tests/e2e/**/*.test.ts",
        ],
        testTimeout: 300000,
        hookTimeout: 300000,
        teardownTimeout: 60000,
        fileParallelism: false,
    },
})
