
import type {Controller} from "../controller"
import {type Command, CommandImpl} from "../../../../shared/Command";

export abstract class SysCommand implements Command{
    readonly isPrivileged: boolean = false;
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

    getSysCmd(cmd: string, subId: string): SysCommand | undefined {
        if (cmd.toLowerCase() === this.cmd.toLowerCase()) {
            return (this.hasRights(subId)) ? this : undefined;
        } else if (this.next_){
            return this.next_.getSysCmd(cmd, subId)
        }
        return undefined
    }

    listCmds(subId: string): Command[] {
        const baseKeys = Object.keys(new CommandImpl());
        const entries = baseKeys.map(key => [key, this[key as keyof this]]);
        const e: Command = Object.fromEntries(entries);
        if (this.next_){
            const cmds = this.next_.listCmds(subId)
            return this.hasRights(subId) ? [e, ...cmds] : cmds;
        } else {
            return this.hasRights(subId) ? [e] : []
        }
    }

    hasRights(subId: string): boolean { return !this.isPrivileged || (this.ctrl.server.hostPlayerConnId === subId) }
}
export abstract class InvisibleSysCommand extends SysCommand {
    override readonly helpMsg: string = "invisible";
    override readonly specHelpMsg: string = "invisible";
    override readonly visible: boolean = false;
}