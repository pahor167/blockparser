import { Graph, Node } from "./build-graph"

export function countLevelOfParallelization(graph: Graph) {
  return graph.nodes.filter(n => n.parents.length === 0).length
}

export function countHighestGas(graph: Graph) {
  const startingNodes = graph.nodes.filter(k => k.parents.length === 0)
  const gasCostsOfDifferentPaths: number[] = []
  for (const sNode of startingNodes) {
    gasCostsOfDifferentPaths.push(highestGas(sNode))
  }

  return Math.max(...gasCostsOfDifferentPaths)
}

function highestGas(node: Node) {
  let gas = 0
  for (const edge of node.edges) {
    const edgeGas = highestGas(edge)
    if (edgeGas > gas) {
      gas = edgeGas
    }
  }

  return gas + node.tx.GasUsed
}
