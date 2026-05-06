
import type {Controller} from "../controller"
import type {Command} from "../../../shared/AbstractCommand";

export abstract class SysCommand implements Command{
    // from the abstract command interface
    abstract readonly cmd: string
    abstract readonly helpMsg: string
    abstract readonly specHelpMsg: string
    abstract readonly visible: boolean
    readonly hasCmdLine: boolean = false

    abstract readonly next_?: SysCommand

    abstract execute(
        observerID: string,
        ctrl: Controller,
        params: string[]
    ): string | undefined

    getSysCmd(cmd: string): SysCommand | undefined {
        if (cmd.toLowerCase() === this.cmd.toLowerCase()) {
            return this
        } else if (this.next_){
            return this.next_.getSysCmd(cmd)
        }
        return undefined
    }

    listCmds(): SysCommand[] {
        if (!this.next_) {
            return [this]
        }
        return [this, ...this.next_.listCmds()]
    }
}
export abstract class InvisibleSysCommand extends SysCommand {
    override readonly helpMsg: string = "invisible";
    override readonly specHelpMsg: string = "invisible";
    override readonly visible: boolean = false;
}