import { Tx } from "./interfaces/file-content"
import { Node, Graph} from "./build-graph"
import { assert } from "console"

export class Assignation {
    idx: number
    machine: number
    start: number
    duration: number
    constructor(idx: number, machine: number, start: number, duration: number) {
        this.idx = idx // tx index
        this.machine = machine
        this.start = start
        this.duration = duration // tx gas cost
    }
    public finishTime(): number {
        return this.start + this.duration
    }
}

export class MachineSchedule {
    machine: number
    assignations: Assignation[] = []
    soonestAvailable: number = 0 // makespan
    constructor(machine: number) {
        this.machine = machine
    }
    public assign(jobIdx: number, start: number, duration: number): Assignation {
        assert(start < this.soonestAvailable)
        const assignation = new Assignation(jobIdx, this.machine, start, duration)
        this.assignations.push(assignation)
        this.soonestAvailable = assignation.finishTime()
        return assignation
    }

}

export class Schedule {
    graph: Graph
    jobs: number
    machines: number
    
    totalMakespan: number = 0

    schedules: MachineSchedule[] = []
    jobAssignations: Assignation[]

    constructor(graph: Graph, machines: number) {
        this.graph = graph
        this.jobs = graph.nodes.length
        this.machines = machines
        this.schedules = new Array(machines)
        for (let i = 0; i < machines; i++) {
            this.schedules[i] = new MachineSchedule(i)
        }
        this.jobAssignations = new Array(this.jobs)
    }

    private dependenciesFinishedAt(jobIdx: number, time: number): boolean {
        const node = this.graph.nodes[jobIdx]
        for (let i = 0; i < node.parents.length; i++) {
            const depIdx = node.parents[i].tx.Index
            if (this.jobAssignations[depIdx] === null) {
                return false
            }
            if (this.jobAssignations[depIdx].finishTime() > time) {
                return false
            }
        }
        return true
    }

    public assign(jobIdx: number, machine: number, time: number) {
        assert(jobIdx >= 0 && jobIdx < this.graph.nodes.length)
        assert(this.jobAssignations[jobIdx] === null)
        assert(machine >= 0 && machine < this.machines)
        assert(this.dependenciesFinishedAt(jobIdx, time))
        const duration = this.graph.nodes[jobIdx].tx.GasUsed
        const assg = this.schedules[machine].assign(jobIdx, time, duration)
        this.jobAssignations[jobIdx] = assg
        
        if (assg.finishTime() > this.totalMakespan) {
            this.totalMakespan = assg.finishTime()
        }
    }
    
    public makespan(): number {
        return this.totalMakespan
    }
}

export function simulateScheduling(g: Graph, m: number): Schedule {
    const sched = new Schedule(g, m)
    // complicated part :)
    return sched
}