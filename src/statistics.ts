import { Graph, Node } from "./build-graph"

export function countLevelOfParallelization(graph: Graph) {
  return graph.nodes.filter(n => n.parents.length === 0).length
}

// Calculates the critical path
export function countHighestGas(graph: Graph) {
  const startingNodes = graph.nodes.filter(k => k.parents.length === 0)
  const gasCostsOfDifferentPaths: number[] = []
  // memoization for recursion
  const memo: Map<number, number> = new Map()
  for (const sNode of startingNodes) {
    gasCostsOfDifferentPaths.push(criticalPathMemoized(sNode, memo))
  }

  return Math.max(...gasCostsOfDifferentPaths)
}

// Calculate Critical path
export function criticalPathMemoized(node: Node, memo: Map<number, number>): number {
  const idx = node.tx.Index
  // memoize to avoid exponential complexity
  if (memo.has(idx)) {
    return memo.get(idx)!
  }

  let gas = 0
  for (const edge of node.edges) {
    const edgeGas = criticalPathMemoized(edge, memo)
    if (edgeGas > gas) {
      gas = edgeGas
    }
  }

  const result = gas + node.tx.GasUsed
  memo.set(idx, result)
  return result
}

export function percentageImprovement(originalValue: number, newValue: number) {
  return newValue * 100 / originalValue
}
