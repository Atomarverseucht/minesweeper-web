import type {Controller} from "./controller";

export abstract class GameState {
    abstract readonly nextState?: GameState
    public readonly context: Controller
    abstract readonly gameState: string
    constructor(context: Controller) {
        this.context = context
    }
    get inGame(): boolean {
        return false
    }

    turn(observerID: string, cmd: string, x: number, y: number): string {
        throw new Error(`cannot make turn in state: ${this.gameState}`)
    }

    public changeState(state: string): void {
        if (state === this.gameState) {
            this.context.state = this
        } else {
            this.nextState?.changeState(state)
        }
    }
}

export class Running extends GameState {
    override readonly gameState = "running"
    override readonly nextState: GameState = new Won(this.context)
    override get inGame(): boolean {
        return true
    }

    override turn(observerID: string, cmd: string, x: number, y: number): string {
        if (!this.context.gb.in(x, y)) {
            throw new Error(`${x} or ${y} is out of bound!`)
        }
        // In TS gibt doCmd direkt den Erfolgswert zurück oder wirft Fehler
        return this.context.undo.doCmd(observerID, cmd, x, y)
    }
}

export class Won extends GameState {
    override readonly nextState: GameState = new Lost(this.context)
    override readonly gameState = "win"
}

export class Lost extends GameState {
    override readonly nextState: GameState = new Start(this.context)
    override readonly gameState = "lost"
}

export class Start extends GameState {
    override readonly gameState = "start"
    override readonly nextState?: GameState = undefined
    override get inGame(): boolean {
        return true;
    }

    override turn(observerID: string, cmd: string, x: number, y: number): string {
        if (!this.context.gb.in(x, y)) {
            throw new Error(`${x} or ${y} is out of bound!`)
        }
        const [xSize, ySize] = this.context.gb.getSize()
        return this.context.doSysCmd(observerID,["generate", String(xSize), String(ySize),
            String(x), String(y), String(this.context.config.bombCount4Generate)]) ?? ""
    }

    public changeState(state: string): void {
        if (state === this.gameState) {
            this.context.state = this
        } else {
            Error("No such state")
        }
    }
}
