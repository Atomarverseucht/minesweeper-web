import type Server from "./server"

export abstract class Observable {
    public readonly server: Server
    protected constructor(server: Server) {
        this.server = server;
    }
    public notifyObservers(): void {
        this.server.notifyObservers()
    }
    public specNotify(subID: string, cmd?: string, msg?: string): void {
        this.server.specNotify(subID, cmd, msg)
    }
}