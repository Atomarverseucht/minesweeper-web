import {SysCommand} from "../SysCommands";

export class UndoCmd extends SysCommand {
    override readonly cmd: string = "undo";
    override readonly helpMsg: string = "discards the last turn";
    override readonly specHelpMsg: string = `undo:
    discards your latest action

undo <count>:
    discards your latest <count> actions`;
    override readonly visible = true;
    override readonly next_ = undefined;

    override execute(observerID: string, params: string[]): string | undefined {
        const count: number = isNaN(Number(params[1])) ? 1 : Number(params[1]);
        for (let i = count; i > 0; i--) {
            this.ctrl.undo.undoStep()
        }
        this.ctrl.notifyObservers()
        return undefined;
    }
}