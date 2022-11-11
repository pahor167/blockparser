import { Tx } from "./interfaces/file-content"
import { Node, Graph } from "./build-graph"
import { assert } from "node:console"
import { criticalPathMemoized } from "./statistics"
import { exit } from "node:process"

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
    soonestAvailable = 0 // makespan
    constructor(machine: number) {
      this.machine = machine
    }

    public assign(jobIdx: number, start: number, duration: number): Assignation {
      assert(start >= this.soonestAvailable, "assigning before machine is ready")
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

    totalMakespan = 0

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
      assert(node !== undefined, "inexistent node requested")
      assert(node.parents !== undefined, "parents of node undefined")
      for (let i = 0; i < node.parents.length; i++) {
        const depIdx = node.parents[i].tx.Index
        if (this.jobAssignations[depIdx] === undefined) {
          return false
        }

        if (this.jobAssignations[depIdx].finishTime() > time) {
          return false
        }
      }

      return true
    }

    public assign(jobIdx: number, machine: number, time: number) {
      assert(jobIdx >= 0 && jobIdx < this.graph.nodes.length, "Assigning inexistent job")
      assert(this.jobAssignations[jobIdx] === undefined, "Job already assigned")
      assert(machine >= 0 && machine < this.machines, "Inexistent machine")
      assert(this.dependenciesFinishedAt(jobIdx, time), "Dependencies not finished")
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

    public freeMachineAt(time: number): number {
      for (let i = 0; i < this.machines; i++) {
        if (this.schedules[i].soonestAvailable <= time) {
          return i
        }
      }

      return -1
    }

    public result(): ScheduleResult {
      return new ScheduleResult(this.machines, this.totalMakespan, this.schedules)
    }
}

class DependencyTracker {
    graph: Graph
    soonest: number[]
    deps: number[]
    available: Set<number> = new Set<number>()
    assignedJobs = 0

    constructor(graph: Graph) {
      this.graph = graph
      const n = this.graph.nodes.length
      this.soonest = new Array(n)
      this.deps = new Array(n)
      // add the amount of deps for every node
      for (let i = 0; i < n; i++) {
        const node = this.graph.nodes[i]
        this.deps[i] = node.parents.length
        this.soonest[i] = -1
        // if this node has no deps, it's available to start now
        if (this.deps[i] == 0) {
          this.soonest[i] = 0
          this.available.add(i)
        }
      }
    }

    public registerAssigned(idx: number, time: number) {
      assert(this.available.has(idx), "registering a non-available job")
      assert(this.soonest[idx] <= time, "registering before available time for job")
      this.available.delete(idx)
      this.assignedJobs++
      // remove dep for childs
      const node = this.graph.nodes[idx]
      for (let i = 0; i < node.edges.length; i++) {
        const child = node.edges[i]
        const childIdx = child.tx.Index
        assert(childIdx < this.graph.nodes.length, "childIdx is not a real node")
        this.deps[childIdx]--
        // If no more deps, add to available
        if (this.deps[childIdx] == 0) {
          this.available.add(childIdx)
        }

        // update their soonest starting time
        const finishTime = time + node.tx.GasUsed
        this.soonest[childIdx] = Math.max(this.soonest[childIdx], finishTime)
      }
    }

    public availableAt(time: number): Set<number> {
      const av = new Set<number>()
      for (const idx of this.available) {
        if (this.soonest[idx] <= time) {
          av.add(idx)
        }
      }

      return av
    }

    public finished(): boolean {
      return this.assignedJobs == this.graph.nodes.length
    }
}

function getCriticals(g: Graph): number[] {
  // memoization for recursion
  const memo: Map<number, number> = new Map()
  const criticals = new Array(g.nodes.length)
  for (let i = 0; i < criticals.length; i++) {
    criticals[i] = criticalPathMemoized(g.nodes[i], memo)
  }

  return criticals
}

function longestCriticalJob(jobs: Set<number>, criticals: number[]): number {
  assert(jobs.size > 0, "No jobs to pick longest critical")
  let criticalIdx = -1
  for (const idx of jobs) {
    if ((criticalIdx == -1) || (criticals[idx] > criticals[criticalIdx])) {
      criticalIdx = idx
    }
  }

  return criticalIdx
}

class Heap {
    // TODO: make this a real heap implementation or wrap an exiting one
    // But maybe it's not needed since this will always have roughly
    // 'machines' amount of items
    values: Set<number> = new Set<number>()
    private peekMin(): number {
      assert(this.values.size > 0, "peekMin on empty Heap")
      let min = -3
      for (const v of this.values) {
        if ((min < 0) || (v < min)) min = v
      }

      return min
    }

    public getMin() {
      const min = this.peekMin()
      this.values.delete(min)
      return min
    }

    public add(v: number) {
      this.values.add(v)
    }

    public isEmpty(): boolean {
      return this.values.size === 0
    }
}

export class ScheduleResult {
    machines: number
    makespan: number
    assignments: MachineSchedule[]
    constructor(machines: number, makespan: number, assignments: MachineSchedule[]) {
      this.machines = machines
      this.makespan = makespan
      this.assignments = assignments
    }
}

// First machine, longer critical job
export function scheduleHeuristic1(g: Graph, m: number): ScheduleResult {
  const sched = new Schedule(g, m)
  // Greedy on biggest critical path
  const criticals = getCriticals(g)
  const depTracker = new DependencyTracker(g)
  const keyFrames = new Heap()
  // Add keyframe 0 to start
  keyFrames.add(0)

  while (!depTracker.finished() && !keyFrames.isEmpty()) {
    const time = keyFrames.getMin()
    let machine = sched.freeMachineAt(time)
    if (machine == -1) {
      // This means a machine is not available
      // This shouldn't be possible
      assert(false, "No machine available")
      exit(1)
    }

    const availables = depTracker.availableAt(time)
    while (availables.size > 0 && machine != -1) {
      // pick a job and assign it
      const job = longestCriticalJob(availables, criticals)
      sched.assign(job, machine, time)
      depTracker.registerAssigned(job, time)
      availables.delete(job)
      // add new keyframe
      keyFrames.add(sched.schedules[machine].soonestAvailable)
      // Pick the next machine. This time there could be none
      machine = sched.freeMachineAt(time)
    }
  }

  assert(depTracker.finished(), "Dependency tracker not finished")
  if (depTracker.assignedJobs < g.nodes.length) {
    // Code didn't work.
    exit(5)
  }

  return sched.result()
}
