export interface Command {
    readonly cmd: string
    readonly helpMsg: string
    readonly specHelpMsg: string
    readonly hasCmdLine: boolean
    readonly isPrivileged: boolean
    readonly visible: boolean
}
export class CommandImpl implements Command {
    readonly cmd: string = "";
    readonly hasCmdLine: boolean = false;
    readonly helpMsg: string = "";
    readonly isPrivileged: boolean = false;
    readonly specHelpMsg: string = "";
    readonly visible: boolean = false;
}