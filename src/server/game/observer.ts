import type Server from "../server"

export abstract class Observable {
    protected constructor(public readonly server: Server) {}
    public notifyObservers(cmd?: string): void {
        this.server.notifyObservers(cmd)
    }
    public specNotify(subID: string, cmd?: string, msg?: string): void {
        this.server.specNotify(subID, cmd, msg)
    }
}