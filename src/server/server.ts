import type * as Party from "partykit/server";
import { Controller } from "./Controller/controller";
import BiMap from 'bidirectional-map'
import type {ServerPayload} from "../types/Payload";
import {Player} from "../types/Player";

export default class Server implements Party.Server {
  count = 0;
  playerNumber = 1
  readonly controller: Controller;
  playerNames = new BiMap<string>();
  playerData = new Map<string, Player>();

  constructor(readonly partyRoom: Party.Room) {
    this.controller = new Controller(this)
  }

  // Initial
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.partyRoom.id}
  url: ${new URL(ctx.request.url).pathname}`,
    );
    this.setName(conn.id, `Player ${this.playerNumber.toString()}`)
    this.playerNumber++
    const payload = {
      type: "init",
      board: this.controller.getBoard(),
      userCount: this.getOnlinePlayersCount(),
      gameState: this.controller.gameState,
      myName: this.playerNames.get(conn.id),
      users: this.playerData.values(),
    };
    conn.send(JSON.stringify(payload));
    this.notifyObservers("names");
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`connection ${sender.id} sent message: ${message}`);
    const name = this.playerNames.get(sender.id)!;
    try {
      const args = message.split(" ");
      console.log(args[1])
      switch (args[0]) {
        case "changeName":
          console.log("server: name change");
          this.setName(sender.id, args[1])
          this.notifyObservers("names");
          this.specNotify(sender.id, "myName"); return;
        case "getNames":
          console.log("server: get names");
          this.specNotify(sender.id, "names"); return;
        case "myName":
          console.log("server: my name");
          this.specNotify(sender.id, "myName"); return;
      }
      if (this.controller.isSysCmd(args[0])) {
        this.controller.doSysCmd(sender.id, args);
        console.log("sysCmd")
      } else {
        this.controller.turn(sender.id, args[0], +args[1], +args[2]);
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

  public notifyObservers(cmd = "update"): void {
    const payload = this.getPayload(cmd)
    this.partyRoom.broadcast(JSON.stringify(payload), []);
    console.log(this.getOnlinePlayersCount());
  }

  public specNotify(subID: string, cmd = "generate", msg?: string): void {

    const payload = this.getPayload(cmd, this.playerNames.get(subID), msg)
    this.partyRoom.getConnection(subID)?.send(JSON.stringify(payload));
  }
  public getPayload(cmd: string, subName?: string, msg?: string): ServerPayload {
    switch (cmd) {
      case "generate":
        return {
          type: "generate",
          board: this.controller.getBoard(),
          userCount: this.getOnlinePlayersCount(),
          gameState: this.controller.gameState,
        };
      case "myName":
        return {
          type: "myName",
          myName: subName!
        }
      case "names":
        return {
          type: "getNames",
          users: Array.from(this.playerData.values()),
          userCount: this.getOnlinePlayersCount()
        };
      case "error":
        return {
          type: "error",
          gameState: msg!,
        }
      default:
        return {
          type: "update",
          board: this.controller.getBoard(),
          userCount: this.getOnlinePlayersCount(),
          gameState: this.controller.gameState,
          users: Array.from(this.playerData.values()),
        };
    }
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
    this.playerData.delete(connection.id);
    this.notifyObservers("names");
  }

  public setName(subID: string, name: string): void {
    if(Array.from(this.playerNames.values()).filter(p => p === name).length <= 0){
      this.playerNames.set(subID, name);
      const n = this.playerData.get(subID);
      if (n) {n.name = name;}
      else this.playerData.set(subID, new Player(name))
    }
  }
}

Server satisfies Party.Worker;
