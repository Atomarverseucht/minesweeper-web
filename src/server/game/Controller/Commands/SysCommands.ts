
import type {Controller} from "../controller"
import {type Command, CommandImpl} from "../../../../shared/Command";

export abstract class SysCommand implements Command{
    readonly isPrivileged = false;
    // from the abstract command interface
    abstract readonly cmd: string
    abstract readonly helpMsg: string
    abstract readonly specHelpMsg: string
    readonly hasCmdLine: boolean = false

    abstract readonly next_?: SysCommand

    constructor(protected readonly ctrl: Controller) {
    }

    visible: boolean = false;
    abstract execute(observerID: string,  params: string[]): string | undefined

    getSysCmd(cmd: string): SysCommand | undefined {
        if (cmd.toLowerCase() === this.cmd.toLowerCase()) {
            return this
        } else if (this.next_){
            return this.next_.getSysCmd(cmd)
        }
        return undefined
    }

    listCmds(subId: string): Command[] {
        const baseKeys = Object.keys(new CommandImpl());
        const entries = baseKeys.map(key => [key, this[key as keyof this]]);
        const e: Command = Object.fromEntries(entries);
        if (!this.next_ //|| ((this.ctrl.server.hostPlayerConnId !== subId) && this.next_.isPrivileged)
        ) {
            return [e]
        }
        return [e, ...this.next_.listCmds(subId)]
    }
}
export abstract class InvisibleSysCommand extends SysCommand {
    override readonly helpMsg: string = "invisible";
    override readonly specHelpMsg: string = "invisible";
    override readonly visible: boolean = false;
}