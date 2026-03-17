import type {SysCommand} from "../SysCommands"
import {GenerateCmd} from "./GenerateCmd"
import type {Controller} from "../../controller"
import type {Command} from "../commandInterfaces"

export class SysCommandManager {
    readonly firstSysCommand = new GenerateCmd()

    public isSysCommand(cmd: string): boolean {
        return (this.firstSysCommand.getSysCmd(cmd) !== undefined)
    }

    public doSysCommand(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        const command = this.firstSysCommand.getSysCmd(params[0])
        if (command) {
            return command.execute(observerID, ctrl, params)
        }
        else {
            return undefined
        }
    }

    public getSysCmdList(): SysCommand[] {
        return this.firstSysCommand.listCmds()
    }
    public getAbstractCmd(cmd: string, ctrl: Controller): Command | undefined{
        const sysCmd = this.firstSysCommand.getSysCmd(cmd)
        return sysCmd ?? ctrl.undo.getCmd(cmd)
    }
}