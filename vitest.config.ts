import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globals: true,
        include: [
            "packages/*/test/**/*.test.ts",
            "tests/e2e/**/*.test.ts",
        ],
        testTimeout: 10000,
        pool: "forks",
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        teardownTimeout: 30000,
    },
})
