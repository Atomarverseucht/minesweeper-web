import {Board} from "../Model/Board"
import {type GameState, Running, Start} from "./state"
import {Observable} from "../observer";
import TurnCommandManager from "./Commands/TurnCommands/TurnCommandManager"
import {SysCommandManager} from "./Commands/SystemCommands/SysCommandManager"
import type Server from "../server";

export class Controller extends Observable{
    public state: GameState = new Running(this)
    public readonly undo
    public readonly sysCmd
    public gb: Board

    constructor(server: Server, gb: Board) {
        super(server)
        this.undo = new TurnCommandManager(this)
        this.sysCmd = new SysCommandManager()
        this.gb = gb
    }

    public turn(observerID: string, cmd: string, x: number, y: number): string {
        try {
            return this.state.turn(observerID, cmd.toLowerCase(), x, y)
        } catch (error) {
            throw error // Entspricht .get auf einem Failure in Scala
        }
    }

    public changeState(newState: string): void {
        this.state.changeState(newState)
    }

    public isSysCmd(cmd: string): boolean {
        return this.sysCmd.isSysCommand(cmd.toLowerCase())
    }

    public doSysCmd(observerID: string, params: string[]): string | null {
        return this.sysCmd.doSysCommand(observerID, this, params) ?? null
    }

    public getBoard(): number[][] {
        return this.gb.getBoard()
    }

    public getSize(): [number, number] {
        return this.gb.getSize()
    }

    public get inGame(): boolean {
        return this.state.inGame
    }

    public get gameState(): string {
        return this.state.gameState;
    }

    public getSysCmdList(): string[] {
        return [];//this.sysCmd.getSysCmdList.map(sys => sys.cmd);
    }

    public isVictory(): boolean {
        return this.gb.isVictory()
    }

    // Statische Factory
    static create(server: Server, xStart: number, yStart: number, xSize: number, ySize: number, bombCount: number): Controller {
        const out = new Controller(server, Board.create(xSize, ySize, xStart, yStart, bombCount))
        //out.state = new Running(out)
        out.undo.doCmd("server", "open", xStart, yStart)
        return out
    }
}
