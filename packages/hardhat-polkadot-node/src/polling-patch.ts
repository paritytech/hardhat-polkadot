import Module from "module"

export function intervalPollingPatch(customInterval = 10) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalRequire = Module.prototype.require as any

    Module.prototype.require = function (id: string) {
        // eslint-disable-next-line prefer-rest-params
        const module = originalRequire.apply(this, arguments)

        if (id === "ethers" || id.includes("@nomiclabs/hardhat-ethers")) {
            if (module.providers?.BaseProvider) {
                const proto = module.providers.BaseProvider.prototype
                if (!proto._pollingPatched) {
                    const orig = proto._ready
                    proto._ready = async function () {
                        this._pollingInterval = customInterval
                        const result = await orig.call(this)
                        this._pollingInterval = customInterval
                        return result
                    }
                    proto._pollingPatched = true
                }
            }
        }

        return module
    }
}
