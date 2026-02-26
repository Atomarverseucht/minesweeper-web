import type * as Party from "partykit/server";
import {Controller} from "./Controller/controller";
export default class Server implements Party.Server {
  count = 0;
  readonly controller: Controller;
  constructor(readonly partyRoom: Party.Room) {
    this.controller = Controller.create(this, 5, 5, 10, 10, 15)
  }
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.partyRoom.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    // send the current count to the new client
    conn.send(this.count.toString());
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
    // we could use a more sophisticated protocol here, such as JSON
    // in the message data, but for simplicity we just use a string
    if (message === "increment") {
      this.increment();
    }
  }

  onRequest(req: Party.Request) {
    // response to any HTTP request (any method, any path) with the current
    // count. This allows us to use SSR to give components an initial value

    // if the request is a POST, increment the count
    if (req.method === "POST") {
      //this.increment();
    }

    return new Response(this.count.toString());
  }

  increment() {
    this.count = (this.count + 1) % 100;
    // broadcast the new count to all clients
    this.partyRoom.broadcast(this.count.toString(), []);
  }

  public notifyObservers(): void {
  }
  public generate(subID: number): void {
  }

  /**
   * Calculates the current number of active WebSocket connections in the room.
   * @returns The count of connected clients.
   */
  public getOnlinePlayersCount(): number {
    let count = 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of this.getActiveConnections("player")) {
      count++
    }
    return count
  }

  /**
   * Returns a list of connections with OPEN state.
   * @param tag An optional filter to target a specific subset of connections.
   */
  public *getActiveConnections(tag?: string): Iterable<Party.Connection> {
    for (const conn of this.partyRoom.getConnections(tag)) {
      if (conn && conn.readyState === WebSocket.OPEN) {
        yield conn
      }
    }
  }
}
Server satisfies Party.Worker