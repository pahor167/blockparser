import { FileContent, Tx } from "./interfaces/file-content"

export function buildGraph(fileContent: FileContent) {
  const forest: Node[] = []
  const alreadyProcessedNodes: Node[] = []

  for (let i = 0; i < fileContent.Txs.length; i++) {
    const tx = fileContent.Txs[i]
    const newNode = new Node(tx)

    let edgeAdded = false

    for (const processedNode of alreadyProcessedNodes) {
      edgeAdded = edgeAdded || decideEdge(newNode, processedNode)
    }

    alreadyProcessedNodes.push(newNode)
    if (!edgeAdded) {
      forest.push(newNode)
    }
  }

  return forest
}

class Node {
    tx: Tx
    edges: Node[] = []
    parents: Node[] = []
    public writeAddresses: Set<string>
    public writeStorage: Record<string, Set<string>>

    public readAddresses: Set<string>
    public readStorage: Record<string, Set<string>>

    constructor(tx: Tx) {
      this.tx = tx

      this.writeAddresses = new Set(tx.Writes)
      // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
      this.writeStorage = Object.keys(tx.StorageWrites).reduce((prev, curr) => ({ ...prev, [curr]: new Set(tx.StorageWrites[curr]) }), {})
      this.readAddresses = new Set([...tx.Reads, ...tx.Writes])
      // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
      this.readStorage = { ...Object.keys(tx.StorageReads).reduce((prev, curr) => ({ ...prev, [curr]: new Set(tx.StorageReads[curr]) }), {}), ...this.writeStorage }
    }

    public addEdge(n: Node) {
      this.edges.push(n)
    }

    public addParent(n: Node) {
      this.parents.push(n)
    }

    toString() {
      return this.tx.Hash
    }
}

// returns if edge was added
function decideEdge(newNode: Node, processedNode: Node): boolean {
  if ([...newNode.readAddresses].some(ra => processedNode.writeAddresses.has(ra))) {
    addEdge(processedNode, newNode)
    return true
  }

  if ([...processedNode.readAddresses].some(ra => newNode.writeAddresses.has(ra))) {
    addEdge(newNode, processedNode)
    return true
  }

  // eslint-disable-next-line no-eq-null, eqeqeq
  if (Object.keys(newNode.readStorage).some(rs => processedNode.writeStorage[rs] != null &&
      [...newNode.readStorage[rs]].some(rss => processedNode.writeStorage[rs].has(rss)))) {
    addEdge(processedNode, newNode)
    return true
  }

  // eslint-disable-next-line no-eq-null, eqeqeq
  if (Object.keys(processedNode.readStorage).some(rs => newNode.writeStorage[rs] != null &&
      [...processedNode.readStorage[rs]].some(rss => newNode.writeStorage[rs].has(rss)))) {
    addEdge(newNode, processedNode)
    return true
  }

  return false
}

function addEdge(child: Node, parent: Node) {
  parent.addEdge(child)
  child.addParent(parent)
}
