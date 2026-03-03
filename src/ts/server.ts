import type * as Party from "partykit/server";
import { Controller } from "./Controller/controller";
import BiMap from 'bidirectional-map'

export default class Server implements Party.Server {
  count = 0;
  playerNumber = 1
  readonly controller: Controller;
  playerNames = new BiMap<string>();

  constructor(readonly partyRoom: Party.Room) {
    this.controller = new Controller(this)
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.partyRoom.id}
  url: ${new URL(ctx.request.url).pathname}`,
    );
    this.playerNames.set(conn.id, `Player ${this.playerNumber.toString()}`);
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
    try {
      const args = message.split(" ");
      switch (args[0]) {
        case "increment": this.increment(); return;
        case "changeName": this.playerNames.set(sender.id, args[1]);
        case "getNames": this.notifyNames(); return;
      }
      if (this.controller.isSysCmd(args[0])) {
        this.controller.doSysCmd(this.playerNames.get(sender.id)!, args);
        console.log("sysCmd")
      } else {
        this.controller.turn(this.playerNames.get(sender.id)!, args[0], +args[1], +args[2]);
        console.log("turn")
      }
    } catch {
      console.log("catched turn")
    }
  }

  increment() {
    this.count = (this.count + 1) % 100;
    this.partyRoom.broadcast(this.count.toString(), []);
  }
  public notifyNames(): void {
    const payload = {
      type: "userChange",
      users: this.playerNames.values(),
      userCount: this.getOnlinePlayersCount()
    };
    this.partyRoom.broadcast(JSON.stringify(payload), []);
  }
  public notifyObservers(): void {
    const payload = {
      type: "update",
      board: this.controller.getBoard(),
      userCount: this.getOnlinePlayersCount(),
      gameState: this.controller.gameState,
    };
    this.partyRoom.broadcast(JSON.stringify(payload), []);
    console.log(this.getOnlinePlayersCount());
  }

  public specNotify(subName: string): void {
    if (!this.controller) return;

    const payload = {
      type: "generate",
      board: this.controller.getBoard(),
      userCount: this.getOnlinePlayersCount(),
      gameState: this.controller.gameState,
    };
    this.partyRoom.getConnection(this.playerNames.getKey(subName)!)?.send(JSON.stringify(payload));
  }

  public getOnlinePlayersCount(): number {
    let count = 0;
    for (const _ of this.getActiveConnections()) {
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
  async onClose(connection: Party.Connection) {
    // Hier Logik einfügen, z.B. aus der Map löschen
    console.log(`User ${this.playerNames.get(connection.id)} disconnected.`);
    this.playerNames.delete(connection.id);
    this.notifyNames();
  }
}

Server satisfies Party.Worker;
