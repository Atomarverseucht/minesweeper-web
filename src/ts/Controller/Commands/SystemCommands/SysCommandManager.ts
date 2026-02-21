import type {SysCommand} from "../SysCommands";
import {GenerateCmd} from "./GenerateCmd";

export class SysCommandManager {
    readonly firstSysCommand: SysCommand = new GenerateCmd();

    public isSysCommand(cmd: string): boolean {
        return false;
    }
}
/*
override def isSysCmd(cmd: String): Boolean =
    firstSysCmd.getSysCmd(cmd).nonEmpty

override def doSysCmd(observerID: Int, ctrl: ControllerTrait, cmd: String, params: Vector[String]): Option[String] =
    val com = firstSysCmd.getSysCmd(cmd)
com match
case Some(value) => value.execute(observerID, ctrl, params)
case None => None

override def getSysCmdList: List[SysCommandCORTrait] = firstSysCmd.listCmds

def getAbstractCmd(cmd: String, ctrl: ControllerTrait): Option[AbstractCmdCOR] =
    val sysCmd = firstSysCmd.getSysCmd(cmd)
if sysCmd.nonEmpty then sysCmd
else ctrl.undo.getCmd(cmd)

override def doShortCut(observerID: Int, ctrl: ControllerTrait, key: KeyCode): Option[String] =
    val out = firstSysCmd.getSysCmd(key).map[Option[String]](_.execute(observerID, ctrl))
out match
case Some(None) => None
case Some(Some(value)) => Some(value)
case None => None*/