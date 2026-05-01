import type * as Party from "partykit/server";
import { Controller } from "./Controller/controller";
import type {ServerPayload} from "../shared/Payload";
import {Player} from "../shared/Player";

export default class Server implements Party.Server {
  count = 0;
  playerNumber = 1
  readonly controller: Controller;
  playerNames = new Map<string, string>();
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
  url: ${new URL(ctx.request.url)}`);
    const name: string | null = new URL(conn.uri).searchParams.get("name");
    if (this.playerData.has(conn.id)) {
      let p = this.playerData.get(conn.id)!;
      p.isOnline = true;
      this.playerNames.set(conn.id, p.name);
    } else if (name) {
      console.log(name)
      this.setName(conn.id, name);
    } else {
      this.setName(conn.id, `Player ${this.playerNumber.toString()}`)
      this.playerNumber++
    }
    const payload = this.getPayload("init", this.playerNames.get(conn.id));
    conn.send(JSON.stringify(payload));
    this.notifyObservers("names");
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log(`connection ${sender.id} sent message: ${message}`);
    try {
      const args = message.split(" ");
      console.log(args);
      if (this.controller.isSysCmd(args[0])) {
        console.log("sysCmd")
        this.controller.doSysCmd(sender.id, args);
      } else {
        this.controller.turn(sender.id, args[0], +args[1], +args[2]);
        console.log("turn")
      }
    } catch {
      console.log("catched turn")
    }
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
    const board = this.controller.getBoard();
    const userCount = this.getOnlinePlayersCount();
    const gameState = this.controller.gameState;
    const users = Array.from(this.playerData.values()).filter(a => a.isOnline)
    switch (cmd) {
      case "generate":
        return {
          type: "generate",
          board: board,
          userCount: userCount,
          gameState: gameState,
        };
      case "myName":
        return {
          type: "myName",
          myName: subName!
        }
      case "names":
        return {
          type: "getNames",
          users: users,
          userCount: userCount
        };
      case "error":
        return {
          type: "error",
          gameState: msg!,
        };
      case "init":
        return {
          type: "init",
          board: board,
          userCount: userCount,
          gameState: this.controller.gameState,
          myName: subName,
          users: users,
          sysCmds: this.controller.getSysCmdList()
      };
      default:
        return {
          type: "update",
          board: board,
          userCount: userCount,
          gameState: this.controller.gameState,
          users: users,
        };
    }
  }

  public getOnlinePlayersCount(): number {
    return Array.from(this.playerData.values()).filter(p => p.isOnline).length;
  }

  async onClose(connection: Party.Connection) {
    console.log(`User ${this.playerNames.get(connection.id)} disconnected.`);
    this.playerNames.delete(connection.id);
    this.playerData.get(connection.id)!.isOnline = false;
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
