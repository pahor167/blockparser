import { Command, Flags } from "@oclif/core"

export default class Claim extends Command {
  static description = "...."

  static examples = ["..."]

  static args = [{ name: "file", require: true }]

  static flags = {
    network: Flags.string({
      char: "n",
      description: "CELO network - default alfajores",
      default: "alfajores",
    }),
  }

  public async run(): Promise<void> {
    // const { args, flags } = await this.parse(Claim)

    // TODO: move logic from test file
  }
}
