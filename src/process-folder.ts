import { readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { buildGraph } from "./build-graph"
import { reduceGraph } from "./graph-reduction"
import { FileContent } from "./interfaces/file-content"
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
      hash: fileContent.Hash,
      highestGas: countHighestGas(reducedGraph), // this is the 'time' it would take if we had infinite cores
      levelOfParallelization: countLevelOfParallelization(reducedGraph), 
    }

    const parsedFilePath = path.parse(file)
    const resFileName = path.join(dirPath, `${parsedFilePath.name}${resultSuffix}`)

    await writeFile(resFileName, JSON.stringify(result))
    console.log(`Result in ${resFileName}`)
  }
}
