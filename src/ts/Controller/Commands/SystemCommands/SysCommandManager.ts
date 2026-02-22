import type {SysCommand} from "../SysCommands";
import {GenerateCmd} from "./GenerateCmd";
import type {Controller} from "../../controller";
import type {Command} from "../commandInterfaces";

export class SysCommandManager {
    readonly firstSysCommand: SysCommand = new GenerateCmd();

    public isSysCommand(cmd: string): boolean {
        return this.firstSysCommand.getSysCmd(cmd) != undefined;
    }

    public doSysCommand(observerID: number, ctrl: Controller, params: string[]): string | undefined {
        const command = this.firstSysCommand.getSysCmd(params[0]);
        if (!command) { return undefined; }
        else {
            return command?.execute(observerID, ctrl, params);
        }
    }

    public getSysCmdList(): SysCommand[] {
        return this.firstSysCommand.listCmds();
    }
    public getAbstractCmd(cmd: string, ctrl: Controller): Command | undefined{
        const sysCmd = this.firstSysCommand.getSysCmd(cmd);
        if (sysCmd) return sysCmd;
        else return ctrl.undo.getCmd(cmd);
    }
}
/*



override def doShortCut(observerID: Int, ctrl: ControllerTrait, key: KeyCode): Option[String] =
    val out = firstSysCmd.getSysCmd(key).map[Option[String]](_.execute(observerID, ctrl))
out match
case Some(None) => None
case Some(Some(value)) => Some(value)
case None => None*/