import type {Board} from "../Model/Board";
import {type GameState, Start} from "./state"

export class Controller {
    public state: GameState = new Start(this);
    public readonly undo: TurnCmdManagerTrait;
    public readonly sysCmd: SysCommandManagerTrait;
    public gb: Board;

    constructor(gb: Board) {
        this.undo = Config.mkUndo(this);
        this.sysCmd = Config.standardSysCmdMan;
        this.gb = gb
    }

    public turn(observerID: number, cmd: string, x: number, y: number): string {
        try {
            return this.state.turn(observerID, cmd.toLowerCase(), x, y);
        } catch (error) {
            throw error; // Entspricht .get auf einem Failure in Scala
        }
    }

    public changeState(newState: string): void {
        this.state.changeState(newState);
    }

    public isSysCmd(cmd: string): boolean {
        return this.sysCmd.isSysCmd(cmd.toLowerCase());
    }

    public doSysCmd(observerID: number, cmd: string, params: string[]): string | null {
        return this.sysCmd.doSysCmd(observerID, this, cmd.toLowerCase(), params) ?? null;
    }

    public getBoard(): number[][] {
        return this.gb.getBoard();
    }

    public getSize(): [number, number] {
        return this.gb.getSize();
    }

    public get inGame(): boolean {
        return this.state.inGame;
    }

    public get gameState(): string {
        return this.state.gameState;
    }

    public getSysCmdList(): string[] {
        return this.sysCmd.getSysCmdList.map(sys => sys.cmd);
    }

    public doShortCut(observerID: number, key: string): string | null {
        return this.sysCmd.doShortCut(observerID, this, key) ?? null;
    }

    public isVictory(): boolean {
        return this.gb.isVictory();
    }

    // Statische Factory
    static create(xStart: number, yStart: number, gb: Board): Controller {
        const out = new Controller(gb);
        out.changeState("running");
        out.undo.doCmd(-1, "open", xStart, yStart);
        return out;
    }
}
