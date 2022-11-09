export interface FileContent {
  Block: number
  Hash: string
  GasUsed: number
  Txs: Tx[]
}

export interface Tx {
  Index: number
  Hash: string
  GasUsed: number
  Reads: string[]
  Writes: string[]
  StorageReads: Record<string, string[]>
  StorageWrites: Record<string, string[]>
}
