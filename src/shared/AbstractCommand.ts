export interface Command {
    readonly cmd: string
    readonly helpMsg: string
    readonly specHelpMsg: string
    readonly hasCmdLine: boolean
}