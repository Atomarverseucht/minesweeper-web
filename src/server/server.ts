import type * as Party from "partykit/server";
import { Controller } from "./game/Controller/controller";
import type { ServerPayload} from "../shared/Payload";
import {Player} from "../shared/Player";
import {v4 as uuid4} from "uuid";
import type {Command} from "../shared/Command";
import {createHash} from "crypto";

export default class Server implements Party.Server {
  count = 0;
  playerNumber = 1
  readonly controller: Controller = new Controller(this);
  playerIds = new Map<string, string>();
  playerData = new Map<string, Player>();
  private hostPlayerConnId?: string;

  constructor(readonly partyRoom: Party.Room) {}

  // Initial
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const connIdHashed = this.hashIDs(conn.id)!;
    console.log(`Connected: hashed id: ${connIdHashed}, room: ${this.partyRoom.id}, url: ${new URL(ctx.request.url)}`);
    const name: string | null = new URL(conn.uri).searchParams.get("name");

    // Re-connect
    if (this.playerData.has(connIdHashed)) {
      let p = this.playerData.get(connIdHashed)!;
      p.isOnline = true;
      this.playerIds.set(p.id, connIdHashed);

      // Connect with preferred name
    } else {
      if (name) {
        this.setName(connIdHashed, name);
        // Connect without preferred name
      } else {
        this.setName(connIdHashed, `Player ${this.playerNumber.toString()}`)
        this.playerNumber++
      }
      this.playerIds.set(this.playerData.get(connIdHashed)!.id, connIdHashed);
    }
    const FEID = this.playerData.get(connIdHashed)!.id
    if(!this.hostPlayerConnId){console.log(this.setPrivilegedUserWithConnID(connIdHashed,undefined))}
    const payload = this.getPayload("init", FEID);
    conn.send(JSON.stringify(payload));
    this.notifyObservers("names");
    console.log("Host: ", this.hostPlayerConnId, ", FEID: ", FEID, ", privUser? ", this.isPrivilegedUser(connIdHashed))
  }

  onMessage(message: string, sender: Party.Connection) {
    const connIdHashed = this.hashIDs(sender.id)!
    console.log(`connection ${connIdHashed}[hashed] sent message: ${message}`);
    try {
      const args = message.split(" ");
      console.log(args);
      if (this.controller.isSysCmd(connIdHashed, args[0])) {
        console.log("sysCmd")
        this.controller.doSysCmd(connIdHashed, args);
      } else {
        console.log(this.controller.turn(connIdHashed, args[0], +args[1], +args[2]));
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
    const payload = this.getPayload(cmd, this.playerData.get(subID)!.id, msg)
    this.partyRoom.getConnection(subID)?.send(JSON.stringify(payload));
  }
  public getPayload(cmd: string, subId?: string, msg?: string): ServerPayload {
    const board = this.controller.getBoard();
    const userCount = this.getOnlinePlayersCount();
    const gameState = this.controller.gameState;
    const users = Array.from(this.playerData.values()).filter(a => a.isOnline)
    const myConnId = subId ? this.playerIds.get(subId) : undefined;
    switch (cmd) {
      case "myName":
        return {
          type: "myName",
          myId: subId!
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
          myId: subId,
          users: users,
          sysCmds: this.controller.getSysCmdList(myConnId!) as Command[],
          isHostPlayer: this.hostPlayerConnId === myConnId
      };
      default:
        return {
          type: "update",
          board: board,
          userCount: userCount,
          gameState: gameState,
          users: users,
        };
    }
  }

  public getOnlinePlayersCount(): number {
    return Array.from(this.playerData.values()).filter(p => p.isOnline).length;
  }

  async onClose(conn: Party.Connection) {
    const connIdHashed = this.hashIDs(conn.id)!;
    let p = this.playerData.get(connIdHashed)!;
    console.log(`User ${p.name} disconnected.`);
    this.controller.doSysCmd(connIdHashed, ["transferHost", ""])
    this.playerIds.delete(p.id);
    p.isOnline = false;
    this.notifyObservers("names");
  }

  public setName(subID: string, name: string): void {
    if(Array.from(this.playerData.values()).filter(p => p.name === name).length <= 0){
      const n = this.playerData.get(subID);
      if (n) {n.name = name;}
      else this.playerData.set(subID, new Player(name, uuid4()))
    }
  }

  public isPrivilegedUser(subId?: string): boolean{
    return this.hostPlayerConnId === this.hashIDs(subId);
  }

  public setPrivilegedUserWithFEID(newPrivUserFEID: string, oldPrivUser?: string): boolean{
    return this.setPrivilegedUserWithConnID(this.playerIds.get(newPrivUserFEID)!, oldPrivUser);
  }

  public setPrivilegedUserWithConnID(newPrivUserFEID: string, oldPrivUser?: string): boolean{
    const hasRights = this.isPrivilegedUser(oldPrivUser)
    if (hasRights) this.hostPlayerConnId = this.hashIDs(newPrivUserFEID);
    return hasRights;
  }

  private hashIDs(subID?: string): string | undefined {
    return subID ? createHash("sha256").update(subID).digest("base64") : undefined;
  }
}

Server satisfies Party.Worker;