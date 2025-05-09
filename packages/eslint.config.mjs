import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import importPlugin from "eslint-plugin-import"

/** @type {import('eslint').Linter.Config[]} */
export default [
    { ignores: [] },
    {
        files: ["**/*.{mjs,ts}"],
        languageOptions: { globals: globals.browser },
        plugins: {
            import: importPlugin,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "import/no-extraneous-dependencies": [
                "error",
                {
                    devDependencies: false,
                },
            ],
            "import/order": [
                "error",
                {
                    groups: ["object", ["builtin", "external"], "parent", "sibling", "index"],
                },
            ],
            "no-duplicate-imports": "error",
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
]
