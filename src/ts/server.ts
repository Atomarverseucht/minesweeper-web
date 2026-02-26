import type * as Party from "partykit/server";
import { Controller } from "./Controller/controller";

export default class Server implements Party.Server {
  count = 0;
  readonly controller: Controller;

  constructor(readonly partyRoom: Party.Room) {
    this.controller = Controller.create(this, 5, 5, 10, 10, 15);
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.partyRoom.id}
  url: ${new URL(ctx.request.url).pathname}`,
    );

    const payload = {
      type: "init",
      board: this.controller.getBoard(),
      userCount: this.getOnlinePlayersCount(),
      gameState: this.controller.gameState,
    };
    conn.send(JSON.stringify(payload));
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`connection ${sender.id} sent message: ${message}`);

    if (message === "increment") {
      this.increment();
      return;
    }

    const args = message.split(" ");
    if (this.controller.isSysCmd(args[0])) {
      this.controller.doSysCmd(sender.id, args);
      console.log("sysCmd")
    } else {
      try {
        this.controller.turn(sender.id, args[0], +args[1], +args[2]);
        console.log("turn")
      } catch {
        // ignored on purpose in this early GUI stage
        console.log("catched turn")
      }
    }
  }

  increment() {
    this.count = (this.count + 1) % 100;
    this.partyRoom.broadcast(this.count.toString(), []);
  }

  public notifyObservers(): void {
    if (!this.controller) return;

    const payload = {
      type: "update",
      board: this.controller.getBoard(),
      userCount: this.getOnlinePlayersCount(),
      gameState: this.controller.gameState,
    };
    this.partyRoom.broadcast(JSON.stringify(payload), []);
    console.log(this.getOnlinePlayersCount());
  }

  public generate(subID: string): void {
    if (!this.controller) return;

    const payload = {
      type: "generate",
      board: this.controller.getBoard(),
      userCount: this.getOnlinePlayersCount(),
      gameState: this.controller.gameState,
    };
    this.partyRoom.getConnection(subID)?.send(JSON.stringify(payload));
  }

  public getOnlinePlayersCount(): number {
    let count = 0;
    for (const _ of this.getActiveConnections("player")) {
      count++;
    }
    return count;
  }

  public *getActiveConnections(tag?: string): Iterable<Party.Connection> {
    for (const conn of this.partyRoom.getConnections(tag)) {
      if (conn && conn.readyState === WebSocket.OPEN) {
        yield conn;
      }
    }
  }
}

Server satisfies Party.Worker;
