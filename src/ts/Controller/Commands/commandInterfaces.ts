import type {Controller} from "../controller";

interface Command {
    readonly cmd: string;
    readonly helpMsg: string;
    readonly specHelpMsg: string;
}
abstract class TurnCommand implements Command {
    abstract helpMsg: string;
    abstract specHelpMsg: string;
    abstract readonly cmd: string;
    abstract doStep(observerID: number, cmd: String, x: number, y: number): string;
    abstract doStep(): string;
    abstract undoStep(): string;
    abstract redoStep(): string;
    abstract readonly next_: TurnCommand;
    abstract buildCmd(observerID: number, cmd: String, x: number, y: number, ctrl: Controller): TurnCommand;
    public listCmds(): TurnCommand[] {
        var cmdList: TurnCommand[] = this.next_.listCmds();
        cmdList.push(this)
        return cmdList;
    }
    public getCmd(cmd: String): TurnCommand | undefined {
        return (cmd === this.cmd) ? this : this.next_.getCmd(cmd);
    }
}