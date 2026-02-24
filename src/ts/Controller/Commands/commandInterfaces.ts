import type {Controller} from "../controller"
import type {cmdOut} from "../../config"

export interface Command {
    readonly cmd: string
    readonly helpMsg: string
    readonly specHelpMsg: string
}
export abstract class TurnCommand implements Command {
    // from the abstract Command
    abstract readonly helpMsg: string
    abstract readonly specHelpMsg: string
    abstract readonly cmd: string

    readonly ctrl: Controller
    readonly observerID: number
    readonly x
    readonly y

    abstract doStep(): cmdOut
    abstract undoStep(): cmdOut
    abstract redoStep(): cmdOut
    abstract readonly next_?: TurnCommand
    constructor(ctrl: Controller, observerID: number, x: number, y: number) {
        this.ctrl = ctrl
        this.observerID = observerID
        this.x = x
        this.y = y
    }
    public buildCmd(cmd: String): TurnCommand | undefined {
        if (cmd === this.cmd) return this
        else if (!this.next_) return undefined
        else return this.next_?.buildCmd(cmd)
    };
    public listCmds(): TurnCommand[] {
        if (this.next_){
            var cmdList: TurnCommand[] = this.next_.listCmds()
            cmdList.push(this)
            return cmdList
        } else return [this]
    }
    public getCmd(cmd: String): TurnCommand | undefined {
        return (cmd === this.cmd) ? this : (this.next_) ? this.next_.getCmd(cmd) : undefined
    }
    static create<T>(
        this: new (ctrl: Controller, id: number, x: number, y: number) => T,
        command: TurnCommand
    ){
        return new this(command.ctrl, command.observerID, command.x, command.y)
    }
}