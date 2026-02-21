import type {Command} from "./commandInterfaces";
import type {Controller} from "../controller";

export abstract class SysCommand implements Command{
    // from the abstract command interface
    abstract readonly cmd: string;
    abstract readonly helpMsg: string;
    abstract readonly specHelpMsg: string;

    abstract readonly next_?: SysCommand;

    abstract execute(
        observerID: number,
        ctrl: Controller,
        params?: string[]
    ): string | undefined;

    getSysCmd(cmd: string): SysCommand| undefined {
        if (cmd === this.cmd) {
            return this;
        } else if (!this.next_){
            return undefined;
        }
        return this.next_?.getSysCmd(cmd);
    }

    listCmds(): SysCommand[] {
        if (!this.next_) {
            return [this];
        }
        return [this, ...this.next_.listCmds()];
    }
}