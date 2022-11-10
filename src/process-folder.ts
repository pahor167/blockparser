import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { buildGraph } from "./build-graph"
import { reduceGraph } from "./graph-reduction"
import { FileContent } from "./interfaces/file-content"
import { countHighestGas, countLevelOfParallelization } from "./statistics"

export async function processFolder(dirPath: string) {
  const files = await readdir(dirPath)

  for (const file of files) {
    const fileContentString = (
      await readFile(path.join(dirPath, file))
    ).toString()

    const fileContent = JSON.parse(fileContentString) as FileContent
    const graph = buildGraph(fileContent)
    const reducedGraph = reduceGraph(graph)

    const result = {
      block: fileContent.Block,
      hash: fileContent.Hash,
      highestGas: countHighestGas(reducedGraph),
      levelOfParallelization: countLevelOfParallelization(reducedGraph),
    }

    const parsedFilePath = path.parse(file)
    const resFileName = path.join(dirPath, `${parsedFilePath.name}-result.json`)

    await writeFile(resFileName, JSON.stringify(result))
  }
}
