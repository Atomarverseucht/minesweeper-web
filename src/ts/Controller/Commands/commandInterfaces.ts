import type {Controller} from "../controller";

export interface Command {
    readonly cmd: string;
    readonly helpMsg: string;
    readonly specHelpMsg: string;
}
export abstract class TurnCommand implements Command {
    // from the abstract Command
    abstract readonly helpMsg: string;
    abstract readonly specHelpMsg: string;
    abstract readonly cmd: string;

    readonly ctrl: Controller;
    readonly observerID: number;
    readonly x;
    readonly y;

    abstract doStep(): string;
    abstract undoStep(): string;
    abstract redoStep(): string;
    abstract readonly next_: TurnCommand;
    constructor(ctrl: Controller, observerID: number, x: number, y: number) {
        this.ctrl = ctrl;
        this.observerID = observerID;
        this.x = x;
        this.y = y;
    }
    public buildCmd(cmd: String): TurnCommand {
        if (cmd === this.cmd) return this
        else return this.next_.buildCmd(cmd);
    };
    public listCmds(): TurnCommand[] {
        var cmdList: TurnCommand[] = this.next_.listCmds();
        cmdList.push(this)
        return cmdList;
    }
    public getCmd(cmd: String): TurnCommand | undefined {
        return (cmd === this.cmd) ? this : this.next_.getCmd(cmd);
    }
}