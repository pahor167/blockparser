import { readFile } from "node:fs/promises"
import { FileContent } from "../../src/interfaces/file-content"
import { buildGraph } from "../../src/build-graph"
import { reduceGraph } from "../../src/graph-reduction"
import { countHighestGas, countLevelOfParallelization } from "../../src/statistics"

describe("graph", () => {
  it("Graph from file", async () => {
    const blocksString = (
      await readFile("/Users/pahor/repo/blockparser/test/test.json")
    ).toString()
    const fileContent = JSON.parse(blocksString) as FileContent

    const graph = buildGraph(fileContent)

    const reducedGraph = reduceGraph(graph)

    const highestGas = countHighestGas(reducedGraph)
    const levelOfParallelization = countLevelOfParallelization(reducedGraph)

    console.log("highestGas", highestGas)
    console.log("levelOfParallelization", levelOfParallelization)

    console.log("f", reducedGraph.nodes[0].tx.Hash)
  })
}).timeout(99_999_999)
