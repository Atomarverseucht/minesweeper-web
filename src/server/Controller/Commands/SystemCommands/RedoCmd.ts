import {SysCommand} from "../SysCommands";
import type {Controller} from "../../controller";
import {UndoCmd} from "./UndoCmd";

export class RedoCmd extends SysCommand{
    override readonly cmd: string = "redo";
    override readonly helpMsg: string = "remakes the last turn which was undone";
    override readonly specHelpMsg: string = `redo:
    remakes your latest undone action

redo <count>:
    remakes your latest <count> undone actions`;
    override readonly visible = true;
    override readonly next_ = new UndoCmd();

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        const count: number = isNaN(Number(params[1])) ? 1 : Number(params[1]);
        for (let i = count; i > 0; i--) {
            ctrl.undo.redoStep()
        }
        ctrl.notifyObservers()
        return undefined;
    }
}