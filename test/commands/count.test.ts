import { readFile } from "node:fs/promises"
import { FileContent, Tx } from "../../src/interfaces/file-content"

describe("count", () => {
  it("count block", async () => {
    await run()
  })
}).timeout(99_999_999)

async function run(): Promise<void> {
  const blocksString = (
    await readFile("/Users/pahor/repo/blockparser/test/16064087.json")
  ).toString()
  const fileContent = JSON.parse(blocksString) as FileContent

  console.log("transaction count in block:", fileContent.Txs.length)
  console.time("timer")

  const possibleTransactionChains =
    traverseTransactions(
      0,
      {
        transactionCount: fileContent.Txs.length,
        gasCost: 0,
        length: 0,
        txHashes: new Set(),
        writeAddresses: new Set(),
        writeStorage: {},
        block: fileContent.Block,
      },
      fileContent.Txs).filter(k => k.length > 0)

  removeDuplicateGroups(possibleTransactionChains)

  console.log("count of possibleTransactionChains:", possibleTransactionChains.length)
  console.timeLog("timer")

  const groupsThatContainAllBlockTransactions = traverseTransactionChains(possibleTransactionChains[0].transactionCount, 0, possibleTransactionChains, {
    chains: new Set(),
    txHashes: new Set(),
    block: possibleTransactionChains[0].block,
  })

  console.timeEnd("timer")

  console.log("groupsThatContainAllBlockTransactions size", groupsThatContainAllBlockTransactions.length)

  let minimalThreadCount = fileContent.Txs.length
  let maxGasPriceOfChain = 0

  for (const group of groupsThatContainAllBlockTransactions) {
    if (minimalThreadCount > group.chains.size) {
      minimalThreadCount = group.chains.size
    }

    const localMax = Math.max(...[...group.chains].map(k => k.gasCost))
    if (maxGasPriceOfChain < localMax) {
      maxGasPriceOfChain = localMax
    }
  }

  console.log("*******************************")
  console.log("Max gas price of chain:", maxGasPriceOfChain)
  console.log("Minimum number of threads to run block on:", minimalThreadCount)
}

// generates all possible chains of transactions
function traverseTransactions(
  depth: number,
  parent: TransactionChain,
  transactions: Tx[],
): TransactionChain[] {
  let res: TransactionChain[] = [parent]
  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i]
    if (parent.txHashes.has(tx.Hash)) {
      continue
    }

    const writesAddresses = filterOutKnownAddresses(tx.Writes)
    // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
    const writeStorage: Record<string, Set<string>> = Object.keys(tx.StorageWrites).reduce((prev, curr) => ({ ...prev, [curr]: new Set(tx.StorageWrites[curr]) }), {})
    const readsAddresses = [...filterOutKnownAddresses(tx.Reads), ...writesAddresses]
    // eslint-disable-next-line unicorn/no-array-reduce, unicorn/prefer-object-from-entries
    // const readStorage: Record<string, Set<string>> = { ...Object.keys(tx.StorageReads).reduce((prev, curr) => ({ ...prev, [curr]: new Set(tx.StorageReads[curr]) }), {}), ...writeStorage }

    if (readsAddresses.some(ra => parent.writeAddresses.has(ra))) {
      continue
    }

    // // eslint-disable-next-line no-eq-null, eqeqeq
    // if (Object.keys(readStorage).some(rs => parent.writeStorage[rs] != null && [...readStorage[rs]].some(rss => parent.writeStorage[rs].has(rss)))) {
    //   continue
    // }

    res = [
      ...res,
      ...traverseTransactions(
        ++depth,
        {
          writeAddresses: new Set([
            ...writesAddresses,
            ...parent.writeAddresses,
          ]),
          writeStorage: { ...parent.writeStorage, ...writeStorage },
          block: parent.block,
          length: parent.length + 1,
          txHashes: new Set([...parent.txHashes, tx.Hash]),
          gasCost: parent.gasCost + tx.GasUsed,
          transactionCount: parent.transactionCount,
        },
        transactions,
      ),
    ]
  }

  return res
}

// Generates block from transaction chains that contains all block transactions
function traverseTransactionChains(
  blockTransactionCount: number,
  index: number,
  groups: TransactionChain[],
  finalGroup: FinalBlock,
): FinalBlock[] {
  let res: FinalBlock[] = []
  if (finalGroup.txHashes.size > blockTransactionCount) {
    return res
  }

  if (finalGroup.txHashes.size === blockTransactionCount) {
    return [finalGroup]
  }

  for (let i = index; i < groups.length; i++) {
    const group = groups[i]

    if (hasTransaction(group, finalGroup)) {
      continue
    }

    res = [
      ...res,
      ...traverseTransactionChains(blockTransactionCount, ++i, groups, {
        chains: new Set([...finalGroup.chains, group]),
        txHashes: new Set([
          ...finalGroup.txHashes,
          ...group.txHashes,
        ]),
        block: finalGroup.block,
      }),
    ]
  }

  return res
}

// removal of groups with same transactions eg {1,2} == {2,1}
function removeDuplicateGroups(groups: TransactionChain[]) {
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i]
    for (let j = i + 1; j < groups.length; j++) {
      const g2 = groups[j]
      if (g.txHashes.size !== g2.txHashes.size) {
        continue
      }

      if ([...g.txHashes].every(o => g2.txHashes.has(o))) {
        groups.splice(j--, 1)
      }
    }
  }
}

function hasTransaction(transactionChain: TransactionChain, finalBlock: FinalBlock) {
  for (const gtx of transactionChain.txHashes) {
    if (finalBlock.txHashes.has(gtx)) {
      return true
    }
  }

  return false
}

function filterOutKnownAddresses(array: string[]) {
  return array.filter(item =>
    item !== "0xd533ca259b330c7a88f74e000a3faea2d63b7972" &&
    item !== "0xe3b1e1647bece359c76582550f6e210999973b50" &&
    item !== "0xd5d444af2788e78fb956818b577be9ebc5485d72")
}

interface FinalBlock {
  chains: Set<TransactionChain>
  txHashes: Set<string>
  block: number
}

interface TransactionChain {
  block: number
  transactionCount: number
  writeAddresses: Set<string>
  writeStorage: Record<string, Set<string>>
  length: number
  txHashes: Set<string>
  gasCost: number
}
