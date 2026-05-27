import GenerateCmd from "./GenerateCmd"
import type {Controller} from "../../controller"
import type {Command} from "../../../../../shared/Command";

export class SysCommandManager {
    readonly firstSysCommand = new GenerateCmd(this.ctrl)
    constructor(private readonly ctrl: Controller) {}
    public isSysCommand(cmd: string, observerID: string): boolean {
        return (this.firstSysCommand.getSysCmd(cmd, observerID) !== undefined)
    }

    public doSysCommand(observerID: string, params: string[]): string | undefined {
        const command = this.firstSysCommand.getSysCmd(observerID, params[0])
        if (command) {
            return command.execute(observerID, params)
        }
        else {
            return undefined
        }
    }

    public getSysCmdList(subId: string): Command[] {
        return this.firstSysCommand.listCmds(subId).filter(cmd => cmd.visible)
    }
}