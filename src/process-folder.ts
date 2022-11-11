import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { buildGraph } from "./build-graph"
import { reduceGraph } from "./graph-reduction"
import { FileContent } from "./interfaces/file-content"
import { scheduleHeuristic1 } from "./schedule"
import { countHighestGas, countLevelOfParallelization } from "./statistics"

export async function processFolder(dirPath: string) {
  const files = await readdir(dirPath)
  const resultSuffix = "-result.json"

  for (const file of files) {
    if (file.includes(resultSuffix)) {
      continue
    }

    console.log("Processing file")
    const fileContentString = (
      await readFile(path.join(dirPath, file))
    ).toString()

    const fileContent = JSON.parse(fileContentString) as FileContent
    const graph = buildGraph(fileContent)
    const reducedGraph = reduceGraph(graph)

    const result = {
      block: fileContent.Block,
      gas: fileContent.GasUsed,
      hash: fileContent.Hash,
      criticalPath: countHighestGas(reducedGraph), // this is the 'time' it would take if we had infinite cores
      heuristic2cores: scheduleHeuristic1(reducedGraph, 2),
      heuristic3cores: scheduleHeuristic1(reducedGraph, 3),
    }

    const parsedFilePath = path.parse(file)
    const resFileName = path.join(dirPath, `${parsedFilePath.name}${resultSuffix}`)

    await writeFile(resFileName, JSON.stringify(result))
    console.log(`Result in ${resFileName}`)
  }
}
