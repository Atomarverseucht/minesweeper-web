import PartySocket from "partysocket";
import { Cookies } from "react-cookie";
import { v4 as uuid4 } from "uuid";
import type { CookieData } from "../../shared/CookieData";
import type { ServerPayload } from "../../shared/Payload";
import { RoomService } from "../roomService";

export type SocketEventHandlers = {
  onOpen: () => void;
  onMessage: (payload: ServerPayload) => void;
  onError?: (error: Error) => void;
};

export class SocketService {
  private readonly cookie = new Cookies();

  connect(roomId: string, handlers: SocketEventHandlers): PartySocket {
    const initialCookie = this.cookie.get<CookieData>("minesweeper-web");

    let id: string;
    let myName: string | undefined = undefined;

    if (initialCookie) {
      id = initialCookie.clientID;
      myName = initialCookie.playerName;
      console.log(myName);
    } else {
      id = uuid4();
    }

    const socket = new PartySocket({
      host: window.location.host,
      room: roomId,
      maxRetries: 0,
      id,
      query: { name: myName },
    });

    socket.addEventListener("open", () => {
      handlers.onOpen();
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      this.handleRawMessage(event.data, handlers);
    });

    return socket;
  }

  disconnect(socket: PartySocket): void {
    socket.close();
  }

  saveName(socket: PartySocket, name: string): void {
    const cdata: CookieData = { clientID: socket.id, playerName: name };
    this.cookie.set("minesweeper-web", cdata);
  }

  private handleRawMessage(rawPayload: unknown, handlers: SocketEventHandlers): void {
    if (typeof rawPayload !== "string") return;

    try {
      const payload: ServerPayload = JSON.parse(rawPayload);
      handlers.onMessage(payload);
    } catch (e) {
      if (e instanceof Error) {
        handlers.onError?.(e);
        console.log(e.message);
      }
    }
  }
}
