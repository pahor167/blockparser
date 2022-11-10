import { Command, Flags } from "@oclif/core"
import { processFolder } from "../process-folder"

export default class Claim extends Command {
  static description = "...."

  static examples = ["..."]

  static args = [{ name: "folder", require: true }]

  public async run(): Promise<void> {
    const { args } = await this.parse(Claim)
    await processFolder(args.folder)
  }
}
