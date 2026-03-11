import type {TurnCommand} from "../commandInterfaces"
import type {Controller} from "../../controller";
import {FlagCommand} from "./FlagCommand"

class TurnCommandManager {
    private undoStack: TurnCommand[] = [];
    private redoStack: TurnCommand[] = [];
    private firstCommandCOR(obsID: string, x: number, y: number) {
        return new FlagCommand(this.control, obsID, x, y); }

    constructor(private control: Controller){}

    private doStep(cmd: TurnCommand): string {
            const stepResult = cmd.doStep(); // Annahme: wirft Error bei Failure oder gibt Try zurück
            this.undoStack.push(cmd);
            this.control.notifyObservers();
            return stepResult.value;
    }

    public redoStep(): void {
        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.redoStep();
            this.undoStack.push(cmd);
        }
    }

    public undoStep(): void {
        const step = this.undoStack.pop();
        if (step) {
            step.undoStep();
            this.redoStack.push(step);
        }
    }

    public doCmd(observerID: string, cmd: string, x: number, y: number): string {
        const result = this.buildCmd(observerID, cmd, x, y)
        if (result) return this.doStep(result); else return ""
    }

    public getStacks(): [TurnCommand[], TurnCommand[]] {
        return [[...this.undoStack], [...this.redoStack]];
    }

    public overrideStacks(undoSt: TurnCommand[], redoSt: TurnCommand[]): void {
        this.undoStack = [...undoSt];
        this.redoStack = [...redoSt];
    }

    public listCmds(): TurnCommand[] {
        return this.firstCommandCOR("server", -1, -1).listCmds();
    }

    public getCmd(cmd: string): TurnCommand | undefined {
        return this.firstCommandCOR("server", -1, -1).getCmd(cmd);
    }

    public startCmd(observerID: string, cmd: string, x: number, y: number): string {
        return "hi 123"
    }

    public buildCmd(observerID: string, cmd: string, x: number, y: number): TurnCommand | undefined {
        return this.firstCommandCOR(observerID, x, y).buildCmd(cmd)
    }
}

export default TurnCommandManager
