import { Network } from "hardhat/types"

export type PolkadotTasksWithWrappedNode = typeof global & {
    _polkadotTasksForWrapping: PolkadotTasksForWrapping
    _polkadotNodeNetwork?: Network
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
