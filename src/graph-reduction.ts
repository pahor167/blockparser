import { Tx } from "./interfaces/file-content"
import { Node, Graph} from "./build-graph"
import { assert } from "console"
import { exit } from "process"

class Reachable {
    // Note: we can't use a union-find because the sets
    // to be merged/absorbed are not disjoint.
    reach: Set<number>

    constructor(root: number) {
        this.reach = new Set<number>([root])
    }
    public canReach(dest: number): boolean {
        return this.reach.has(dest)
    }
    public absorb(other: Reachable) {
        // Is this reasonable? This feels like O(n+m)
        // this.reach = new Set<number>([...this.reach, ...other.reach])

        // Different approach, iterate second set, add to first (if truly hashsets)
        // should be O(n) instead of O(n+m) ? Does it even matter with these
        // n sizes?
        let destReach = this.reach
        other.reach.forEach(n => destReach.add(n))
    }
}

class ReductionBuilder {    
    graph: Graph
    n: number

    constructor(originalGraph: Graph) {
        this.n = originalGraph.nodes.length
        this.graph = originalGraph
    }

    public reduce(): Graph {
        // From every node, the first arc can't be removed,
        // since it's the lower destination node number (so
        // it's impossible for other node to supply a different 
        // path)
        //
        // Let's say node i has m outgoing arcs. Imagine we have
        // the transitive closure from all outgoing arcs [0 .. j - 1].
        // Then to evaluate arc j, we check the transitive closure of
        // the previous arcs.
        //
        // The transitive closure is built on the go, from the last
        // to the first node, and every node merging the closure from
        // the remaining arcs.

        let reachableBy: Reachable[] = new Array(this.n)
        let reducedNodes: Node[] = new Array(this.n)
        for (let i = this.n - 1; i >= 0; i--) {
            this.calcReducedNode(i, reducedNodes, reachableBy)
        }
        return new Graph(reducedNodes)
    }


    private calcReducedNode(idx: number, reducedNodes: Node[], 
        reachableBy: Reachable[]) {
        let originalNode = this.graph.nodes[idx]
        // Just in case...
        assert(originalNode.tx.Index == idx)

        let reducedNode = new Node(originalNode.tx)

        // Initialize growing structures
        reducedNodes[idx] = reducedNode
        reachableBy[idx] = new Reachable(idx)

        for (let i = 0; i < originalNode.edges.length; i++) {
            let destNode = originalNode.edges[i]
            let destIdx = destNode.tx.Index
            if (!reachableBy[idx].canReach(destIdx)) {
                // Can't reach this with the previous arcs, arc
                // is maintained
                this.connect(idx, destIdx, reducedNodes)
                reachableBy[idx].absorb(reachableBy[destIdx])
            }
        }
    }

    private connect(i: number, j: number, nodes: Node[]) {
        nodes[i].addEdge(nodes[j])
        nodes[j].addParent(nodes[i])
    }
}

// Graph is interpreted as a list of parent nodes (domain)
// reduceGraph will compute the transitive reduction of the
// given dag.
export function reduceGraph(g: Graph): Graph {
    let rc = new ReductionBuilder(g)
    return rc.reduce()
}