// TODO(v3): This file will be deleted in PR 7 (network hooks migration)
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
