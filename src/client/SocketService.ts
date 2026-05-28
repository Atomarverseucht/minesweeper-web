import PartySocket from "partysocket";
import { Cookies } from "react-cookie";
import { v4 as uuid4 } from "uuid";
import type { CookieData } from "../shared/CookieData";
import type { ServerPayload } from "../shared/Payload";
import { RoomService } from "./roomService";
import type {GameState} from "./UIState";
import {useState} from "react";
import {BoardLayoutService} from "./components/GameUI";

export type SocketEventHandlers = {
  onOpen: () => void;
  onMessage: (payload: ServerPayload) => void;
  onError?: (error: Error) => void;
};

class SocketServiceInstance {
  private gstate: GameState = {
    board: BoardLayoutService.fallbackBoard(10, 10),
    userCount: 0,
    statusText: "Connecting to server...",
    roomId: RoomService.getOrCreateRoomId(),
    copyHint: "",
    sysCmds: [],
  };
  const [gameState, setGameState] = useState<GameState>(gstate);
  private readonly cookie = new Cookies();
  private connectSocket(): void {
    const socket = this.socketService.connect(this.state.roomId, {
      onOpen: () => {
        this.setState({ statusText: "Connected." });
      },
      onMessage: (payload: ServerPayload) => {
        this.handleJsonPayload(payload);
      },
      onError: (error: Error) => {
        console.log(error.message);
      },
    });
    this.setState({ socket });
  }

  public connect(): PartySocket {
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

  public disconnect(socket: PartySocket): void {
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


  private handleJsonPayload(payload: ServerPayload): void {
    if (payload.board) this.setState({ board: payload.board });
    if (payload.userCount) this.setState({ userCount: payload.userCount });

    if (payload.gameState === "win") {
      this.setState({ statusText: "🎉 You won!" });
    } else if (payload.gameState === "lost") {
      this.setState({ statusText: "💥 Game over." });
    }

    if (payload.sysCmds) this.setState({ sysCmds: payload.sysCmds });
    if (payload.myId) this.setState({ ownId: payload.myId });

    if (payload.users) {
      this.applyNames(payload.users);
      this.setOwnName(payload.users.find((p) => p.id === this.state.ownId)?.name ?? "ERRÖR");
    }
  }
}
export const socketService = new SocketServiceInstance()