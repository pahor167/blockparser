import { readFile } from "node:fs/promises"
import { FileContent } from "../../src/interfaces/file-content"
import { buildGraph } from "../../src/build-graph"

describe("graph", () => {
  it("Graph from file", async () => {
    const blocksString = (
      await readFile("/Users/pahor/repo/blockparser/test/test.json")
    ).toString()
    const fileContent = JSON.parse(blocksString) as FileContent

    const forest = buildGraph(fileContent)
    console.log("f", forest.nodes[0].tx.Hash)
  })
}).timeout(99_999_999)
