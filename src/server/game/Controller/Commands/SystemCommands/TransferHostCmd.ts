import {SysCommand} from "../SysCommands";
import {UndoCmd} from "./UndoCmd";

export class TransferHostCmd extends SysCommand{
    override readonly cmd: string = "transferHost";
    override readonly helpMsg: string = "changed the host";
    override readonly next_: SysCommand = new UndoCmd(this.ctrl);
    override readonly specHelpMsg: string = "";
    override readonly isPrivileged: boolean = true;
    override readonly visible: boolean = true;
    override readonly hasCmdLine: boolean = true;

    execute(observerID: string, params: string[]): string | undefined {
        const server = this.ctrl.server;
        let user: string;
        if (params.length < 2) {
            user = Array.from(server.playerIds.values()).filter(e => e !== observerID) [Math.floor(Math.random() * server.playerIds.size - 1)];
        }
        else if (server.playerIds.has(params[1])) {
            user = params[1];
        } else {
            const p = Array.from(server.playerData.values()).find(e => e.name === params[1]);
            if (p) {user = p.id}
            else {
                user = Array.from(server.playerIds.values()).filter(e => e !== observerID) [Math.floor(Math.random() * server.playerIds.size - 1)];
            }
        }
        server.setPrivilegedUserWithFEID(user, observerID);
        server.specNotify(server.playerIds.get(user)!, "init")
        server.specNotify(observerID, "init")
        return undefined;
    }

}