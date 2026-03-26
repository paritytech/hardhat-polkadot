import { describe, it, expect } from "vitest"

import {
    PLUGIN_NAME,
    RESOLC_ARTIFACT_FORMAT_VERSION,
    COMPILER_REPOSITORY_URL,
    COMPILER_REPOSITORY_API_URL,
    defaultNpmResolcConfig,
    defaultBinaryResolcConfig,
} from "../src/constants.js"

describe("constants", () => {
    it("defines plugin name", () => {
        expect(PLUGIN_NAME).toBe("hardhat-polkadot")
    })

    it("defines artifact format version", () => {
        expect(RESOLC_ARTIFACT_FORMAT_VERSION).toBe("hh-resolc-artifact-1")
    })

    it("defines valid compiler repository URL", () => {
        expect(COMPILER_REPOSITORY_URL).toMatch(/^https:\/\//)
        expect(COMPILER_REPOSITORY_URL).toContain("github.com")
    })

    it("defines valid compiler repository API URL", () => {
        expect(COMPILER_REPOSITORY_API_URL).toMatch(/^https:\/\/api\.github\.com/)
    })
})

describe("defaultNpmResolcConfig", () => {
    it("uses npm as compiler source", () => {
        expect(defaultNpmResolcConfig.compilerSource).toBe("npm")
    })

    it("has a version defaulting to latest", () => {
        expect(defaultNpmResolcConfig.version).toBe("latest")
    })

    it("has empty settings", () => {
        expect(defaultNpmResolcConfig.settings).toEqual({})
    })
})

describe("defaultBinaryResolcConfig", () => {
    it("uses binary as compiler source", () => {
        expect(defaultBinaryResolcConfig.compilerSource).toBe("binary")
    })

    it("has a version defaulting to latest", () => {
        expect(defaultBinaryResolcConfig.version).toBe("latest")
    })

    it("enables optimizer by default", () => {
        expect(defaultBinaryResolcConfig.settings?.optimizer?.enabled).toBe(true)
    })

    it("sets optimizer runs to 200", () => {
        expect(defaultBinaryResolcConfig.settings?.optimizer?.runs).toBe(200)
    })
})
