import type {SysCommand} from "../SysCommands"
import {GenerateCmd} from "./GenerateCmd"
import type {Controller} from "../../controller"
import type {Command} from "../../../../../shared/AbstractCommand";

export class SysCommandManager {
    readonly firstSysCommand = new GenerateCmd(this.ctrl)
    constructor(private readonly ctrl: Controller) {}
    public isSysCommand(cmd: string): boolean {
        return (this.firstSysCommand.getSysCmd(cmd) !== undefined)
    }

    public doSysCommand(observerID: string, params: string[]): string | undefined {
        const command = this.firstSysCommand.getSysCmd(params[0])
        if (command) {
            return command.execute(observerID, params)
        }
        else {
            return undefined
        }
    }

    public getSysCmdList(subId: string): SysCommand[] {
        return this.firstSysCommand.listCmds(subId).filter(cmd => cmd.visible)
    }
    public getAbstractCmd(cmd: string, ctrl: Controller): Command | undefined {
        const sysCmd = this.firstSysCommand.getSysCmd(cmd)
        return sysCmd ?? ctrl.undo.getCmd(cmd)
    }
}