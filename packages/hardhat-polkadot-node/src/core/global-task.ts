import { Network } from "hardhat/types"

export type PolkaVMTasksWithWrappedNode = typeof global & {
    _polkaVMTasksForWrapping: PolkaVMTasksForWrapping
    _polkaVMNodeNetwork?: Network
}

export class PolkaVMTasksForWrapping {
    public taskNames: string[] = []

    constructor() {
        this.taskNames = []
    }

    public addTask(taskName: string) {
        this.taskNames.push(taskName)
    }
}
