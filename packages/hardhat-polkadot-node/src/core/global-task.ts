// TODO(v3): This file uses Hardhat v2 internal APIs and will be replaced with v3 network hooks
import type { TargetVM } from "../types.js"

export type PolkadotTasksWithWrappedNode = typeof global & {
    _polkadotTasksForWrapping: PolkadotTasksForWrapping
    _polkadotNodeNetwork?: { polkadot?: boolean | TargetVM }
}

export class PolkadotTasksForWrapping {
    public taskNames: string[] = []

    constructor() {
        this.taskNames = []
    }

    public addTask(taskName: string) {
        this.taskNames.push(taskName)
    }
}
