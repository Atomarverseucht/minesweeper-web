
import type {Controller} from "../controller"
import type {Command} from "../../../../shared/AbstractCommand";

export abstract class SysCommand implements Command{
    readonly isPrivileged = false;
    // from the abstract command interface
    abstract readonly cmd: string
    abstract readonly helpMsg: string
    abstract readonly specHelpMsg: string
    abstract readonly visible: boolean
    readonly hasCmdLine: boolean = false

    abstract readonly next_?: SysCommand

    constructor(readonly ctrl: Controller) {}
    abstract execute(observerID: string,  params: string[]): string | undefined

    getSysCmd(cmd: string): SysCommand | undefined {
        if (cmd.toLowerCase() === this.cmd.toLowerCase()) {
            return this
        } else if (this.next_){
            return this.next_.getSysCmd(cmd)
        }
        return undefined
    }

    listCmds(subId: string): SysCommand[] {
        if (!this.next_ || ((this.ctrl.server.hostPlayerConnId !== subId) && this.next_.isPrivileged)) {
            return [this]
        }
        return [this, ...this.next_.listCmds(subId)]
    }
}
export abstract class InvisibleSysCommand extends SysCommand {
    override readonly helpMsg: string = "invisible";
    override readonly specHelpMsg: string = "invisible";
    override readonly visible: boolean = false;
}