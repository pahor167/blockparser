import { expect } from "chai"
import { buildGraph } from "../src/build-graph"
import { FileContent } from "../src/interfaces/file-content"

describe("Build graph", () => {
  it("should build empty graph", () => {
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(0)
  })

  it("should build graph with no dependencies", () => {
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: "tx1",
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: "tx2",
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(2)
    expect(graph.nodes.every(n => n.parents.length === 0)).to.be.true
    expect(graph.nodes.every(n => n.edges.length === 0)).to.be.true
  })

  it("should build graph with single parent/child relationship based on reads/writes - second transaction reads write of first", () => {
    const tx1 = "tx1"
    const tx2 = "tx2"
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: tx1,
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx2,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read", "tx1Write"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(2)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[0].tx.Hash).to.eq(tx2)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.parents[0].tx.Hash).to.eq(tx1)
  })

  it("should build graph with single parent/child relationship based on reads/writes - first transaction reads write of second", () => {
    const tx1 = "tx1"
    const tx2 = "tx2"
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: tx1,
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read", "tx2Write"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx2,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(2)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[0].tx.Hash).to.eq(tx2)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.parents[0].tx.Hash).to.eq(tx1)
  })

  it("should build graph with single parent/child relationship based on storageReads/storageWrites - second transaction reads write of first", () => {
    const tx1 = "tx1"
    const tx2 = "tx2"
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: tx1,
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx2,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(2)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[0].tx.Hash).to.eq(tx2)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.parents[0].tx.Hash).to.eq(tx1)
  })

  it("should build graph with single parent/child relationship based on storageReads/storageWrites - first transaction reads write of second", () => {
    const tx1 = "tx1"
    const tx2 = "tx2"
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: tx1,
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx2,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(2)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[0].tx.Hash).to.eq(tx2)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.parents[0].tx.Hash).to.eq(tx1)
  })

  it("should build graph with two-parent-node", () => {
    const tx1 = "tx1"
    const tx2 = "tx2"
    const tx3 = "tx3"
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: tx1,
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx2,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx3,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx3Read", "tx1Write", "tx2Write"],
          Writes: ["tx3Write"],
          StorageReads: {
            tx3StorageRead: [
              "tx3StorageRead",
            ],
          },
          StorageWrites: {
            tx3StorageWrite: [
              "tx3StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(3)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[0].tx.Hash).to.eq(tx3)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.edges[0].tx.Hash).to.eq(tx3)
    expect(graph.nodes.find(n => n.tx.Hash === tx3)?.parents[0].tx.Hash).to.eq(tx1)
    expect(graph.nodes.find(n => n.tx.Hash === tx3)?.parents[1].tx.Hash).to.eq(tx2)
  })

  it("should build graph with two-edge node", () => {
    const tx1 = "tx1"
    const tx2 = "tx2"
    const tx3 = "tx3"
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: tx1,
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx2,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read", "tx1Write"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx3,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx3Read", "tx1Write"],
          Writes: ["tx3Write"],
          StorageReads: {
            tx3StorageRead: [
              "tx3StorageRead",
            ],
          },
          StorageWrites: {
            tx3StorageWrite: [
              "tx3StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(3)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[0].tx.Hash).to.eq(tx2)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[1].tx.Hash).to.eq(tx3)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.parents[0].tx.Hash).to.eq(tx1)
    expect(graph.nodes.find(n => n.tx.Hash === tx3)?.parents[0].tx.Hash).to.eq(tx1)
  })

  it("should build chained graph", () => {
    const tx1 = "tx1"
    const tx2 = "tx2"
    const tx3 = "tx3"
    const fileContent = {
      Block: 111,
      Hash: "#blockHash",
      GasUsed: 222,
      Txs: [{
        Hash: tx1,
        Index: 0,
        GasUsed: 100,
        Accesses: {
          Reads: ["tx1Read"],
          Writes: ["tx1Write"],
          StorageReads: {
            tx1StorageRead: [
              "tx1StorageRead",
            ],
          },
          StorageWrites: {
            tx1StorageWrite: [
              "tx1StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx2,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx2Read", "tx1Write"],
          Writes: ["tx2Write"],
          StorageReads: {
            tx2StorageRead: [
              "tx2StorageRead",
            ],
          },
          StorageWrites: {
            tx2StorageWrite: [
              "tx2StorageWrite",
            ],
          },
        },
      },
      {
        Hash: tx3,
        Index: 1,
        GasUsed: 200,
        Accesses: {
          Reads: ["tx3Read", "tx2Write"],
          Writes: ["tx3Write"],
          StorageReads: {
            tx3StorageRead: [
              "tx3StorageRead",
            ],
          },
          StorageWrites: {
            tx3StorageWrite: [
              "tx3StorageWrite",
            ],
          },
        },
      }],
    } as FileContent
    const graph = buildGraph(fileContent)

    expect(graph.nodes.length).to.eq(3)
    expect(graph.nodes.find(n => n.tx.Hash === tx1)?.edges[0].tx.Hash).to.eq(tx2)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.edges[0].tx.Hash).to.eq(tx3)
    expect(graph.nodes.find(n => n.tx.Hash === tx2)?.parents[0].tx.Hash).to.eq(tx1)
    expect(graph.nodes.find(n => n.tx.Hash === tx3)?.parents[0].tx.Hash).to.eq(tx2)
  })
})
