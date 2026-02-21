import type {TurnCommand} from "../commandInterfaces"
import type {Controller} from "../../controller";
import {FlagCommand} from "./FlagCommand"

export class TurnCommandManager {
    private undoStack: TurnCommand[] = [];
    private redoStack: TurnCommand[] = [];
    private firstCommandCOR(obsID: number, x: number, y: number) {
        return new FlagCommand(this.control, obsID, x, y); }

    constructor(private control: Controller){}

    private doStep(cmd: TurnCommand): string {
            const stepResult = cmd.doStep(); // Annahme: wirft Error bei Failure oder gibt Try zurück
            this.undoStack.push(cmd);
            this.control.notifyObservers();
            return stepResult;
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

    public doCmd(observerID: number, cmd: string, x: number, y: number): string {
        const result = this.buildCmd(observerID, cmd, x, y);
        return this.doStep(result);
    }

    public getStacks(): [TurnCommand[], TurnCommand[]] {
        return [[...this.undoStack], [...this.redoStack]];
    }

    public overrideStacks(undoSt: TurnCommand[], redoSt: TurnCommand[]): void {
        this.undoStack = [...undoSt];
        this.redoStack = [...redoSt];
    }

    public listCmds(): TurnCommand[] {
        return this.firstCommandCOR(-1, -1, -1).listCmds();
    }

    public getCmd(cmd: string, obsID: number): TurnCommand | undefined {
        return this.firstCommandCOR(obsID, -1, -1).getCmd(cmd);
    }

    public startCmd(observerID: number, cmd: string, x: number, y: number): string {
        return "hi 123"
    }

    public buildCmd(observerID: number, cmd: string, x: number, y: number): TurnCommand {
        return this.firstCommandCOR(observerID, x, y).buildCmd(cmd);
    }
}
