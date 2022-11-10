import { FileContent, Tx } from "./interfaces/file-content"

export function buildGraph(fileContent: FileContent): Graph {
  const alreadyProcessedNodes: Node[] = []

  for (let i = 0; i < fileContent.Txs.length; i++) {
    const tx = fileContent.Txs[i]
    const newNode = new Node(tx)

    for (const processedNode of alreadyProcessedNodes) {
      decideEdge(newNode, processedNode)
    }

    alreadyProcessedNodes.push(newNode)
  }
  // This is not necessarily a forest like we thought before 
  // because we can have:
  // tx 0 -> tx 4
  // tx 1 -> tx 4
  // no more edges.
  //
  // so now both tx 0 and tx 1 end up being part of the same tree,
  // while both appear as nodes in the list.
  // I believe the term for this nodes is "Graph domain", the set
  // of nodes of the dag from which there is no possible way to 
  // get to them from other nodes. ("Graph codomain" is the opposite).
  // return forest

  // Since I don't think they are useful right now I'm leaving them out
  // because in any case recalculating them is just a nodes.filter(noParent)
  return new Graph(alreadyProcessedNodes)
}

export class Graph {
  nodes: Node[]
  constructor(allNodes: Node[]) {
    this.nodes = allNodes
  }
}

export class Node {
    tx: Tx
    edges: Node[] = []
    parents: Node[] = []
    public writeAddresses: Set<string>
    public writeStorage: Record<string, Set<string>> = {}

    public readAddresses: Set<string>
    public readStorage: Record<string, Set<string>> = {}

    constructor(tx: Tx) {
      this.tx = tx

      this.writeAddresses = new Set(tx.Writes)
      for (const storageWriteKey of Object.keys(tx.StorageWrites)) {
        // eslint-disable-next-line no-eq-null, eqeqeq
        if (this.writeStorage[storageWriteKey] == null) {
          this.writeStorage[storageWriteKey] = new Set()
        }

        Object.values(tx.StorageWrites[storageWriteKey]).map(value => this.writeStorage[storageWriteKey].add(value))
      }

      // this.writeStorage = Object.keys(tx.StorageWrites).reduce((prev, curr) => ({ ...prev, [curr]: new Set(tx.StorageWrites[curr]) }), {})
      this.readAddresses = new Set([...tx.Reads, ...tx.Writes])

      for (const storageWriteKey of Object.keys(tx.StorageWrites)) {
        // eslint-disable-next-line no-eq-null, eqeqeq
        if (this.readStorage[storageWriteKey] == null) {
          this.readStorage[storageWriteKey] = new Set()
        }

        Object.values(tx.StorageWrites[storageWriteKey]).map(value => this.readStorage[storageWriteKey].add(value))
      }

      for (const storageReadKey of Object.keys(tx.StorageReads)) {
        // eslint-disable-next-line no-eq-null, eqeqeq
        if (this.readStorage[storageReadKey] == null) {
          this.readStorage[storageReadKey] = new Set()
        }

        Object.values(tx.StorageReads[storageReadKey]).map(value => this.readStorage[storageReadKey].add(value))
      }
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
    addEdge(newNode, processedNode)
    return true
  }

  // if ([...processedNode.readAddresses].some(ra => newNode.writeAddresses.has(ra))) {
  //   addEdge(newNode, processedNode)
  //   return true
  // }

  // eslint-disable-next-line no-eq-null, eqeqeq
  if (Object.keys(newNode.readStorage).some(rs => processedNode.writeStorage[rs] != null &&
      [...newNode.readStorage[rs]].some(rss => processedNode.writeStorage[rs].has(rss)))) {
    addEdge(newNode, processedNode)
    return true
  }

  // // eslint-disable-next-line no-eq-null, eqeqeq
  // if (Object.keys(processedNode.readStorage).some(rs => newNode.writeStorage[rs] != null &&
  //     [...processedNode.readStorage[rs]].some(rss => newNode.writeStorage[rs].has(rss)))) {
  //   addEdge(newNode, processedNode)
  //   return true
  // }

  return false
}

function addEdge(child: Node, parent: Node) {
  parent.addEdge(child)
  child.addParent(parent)
}
