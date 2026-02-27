import { Component, type CSSProperties, type MouseEvent } from "react";
import PartySocket from "partysocket";

const ROOM_ID_PATTERN = /(?:\?|&|\/)room=([A-Za-z0-9_-]+)/;

type ServerPayload = {
  type: "update" | "init" | "generate";
  board?: number[][];
  userCount?: number;
  gameState?: string;
};

type ToolMode = "open" | "flag";

type GameUIState = {
  board: number[][];
  userCount: number;
  statusText: string;
  roomId: string;
  copyHint: string;
};

class RoomService {
  public static createRoomId(length = 8): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
  }

  public static getOrCreateRoomId(): string {
    const url = new URL(window.location.href);
    const queryRoom = url.searchParams.get("room");
    if (queryRoom) {
      return queryRoom;
    }

    const pathRoom = window.location.href.match(ROOM_ID_PATTERN)?.[1];
    if (pathRoom) {
      return pathRoom;
    }

    const generatedRoomId = RoomService.createRoomId();
    url.searchParams.set("room", generatedRoomId);
    window.history.replaceState({}, "", url.toString());
    return generatedRoomId;
  }

  public static buildRoomLink(roomId: string): string {
    return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
  }
}

class BoardLayoutService {
  public static fallbackBoard(width: number, height: number): number[][] {
    return Array.from({ length: width }, () => Array.from({ length: height }, () => -1));
  }

  public static getDimensions(board: number[][]): [number, number] {
    if (!board.length || !board[0]) {
      return [0, 0];
    }
    return [board.length, board[0].length];
  }

  public static getCellSize(width: number, height: number): string {
    const safeWidth = Math.max(width, 1);
    const safeHeight = Math.max(height, 1);
    return `min(34px, calc((100vw - 5rem) / ${safeWidth}), calc((100vh - 16rem) / ${safeHeight}))`;
  }
}

export default class GameUI extends Component<Record<string, never>, GameUIState> {
  private socket?: PartySocket = undefined;

  private clearCopyHintTimeout?: number = undefined;

  public constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      board: BoardLayoutService.fallbackBoard(10, 10),
      userCount: 0,
      statusText: "Verbinde zum Spielserver ...",
      roomId: RoomService.getOrCreateRoomId(),
      copyHint: "",
    };
  }

  public componentDidMount(): void {
    this.connectSocket();
  }

  public componentWillUnmount(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
    if (this.clearCopyHintTimeout !== undefined) {
      window.clearTimeout(this.clearCopyHintTimeout);
      this.clearCopyHintTimeout = undefined;
    }
  }

  private connectSocket(): void {
    this.socket = new PartySocket({
      host: window.location.host,
      room: this.state.roomId,
    });

    this.socket.addEventListener("open", () => {
      this.setState({ statusText: "Verbunden. Du kannst jetzt spielen." });
    });

    this.socket.addEventListener("message", (event: MessageEvent) => {
      this.handleServerMessage(event.data);
    });
  }

  private handleServerMessage(rawPayload: unknown): void {
    try {
      const payload = JSON.parse(rawPayload as string) as ServerPayload;
      if (payload.board) {
        this.setState({ board: payload.board });
      }
      if (typeof payload.userCount === "number") {
        this.setState({ userCount: payload.userCount });
      }
      if (payload.gameState === "win") {
        this.setState({ statusText: "🎉 Du hast gewonnen!" });
      } else if (payload.gameState === "lost") {
        this.setState({ statusText: "💥 Game Over!" });
      }
    } catch {
      this.setState({ statusText: "Ungültige Servernachricht erhalten." });
    }
  }

  private sendTurn(command: ToolMode, x: number, y: number): void {
    this.socket?.send(`${command} ${x} ${y}`);
  }

  private handlePrimaryClick = (x: number, y: number): void => {
    this.sendTurn("open", x, y);
  };

  private handleSecondaryClick = (event: MouseEvent<HTMLButtonElement>, x: number, y: number): void => {
    event.preventDefault();
    this.sendTurn("flag", x, y);
  };

  private copyRoomLink = async (): Promise<void> => {
    const roomLink = RoomService.buildRoomLink(this.state.roomId);
    try {
      await navigator.clipboard.writeText(roomLink);
      this.setState({ copyHint: "Link kopiert" });
    } catch {
      this.setState({ copyHint: "Kopieren fehlgeschlagen" });
    }

    if (this.clearCopyHintTimeout !== undefined) {
      window.clearTimeout(this.clearCopyHintTimeout);
    }

    this.clearCopyHintTimeout = window.setTimeout(() => {
      this.setState({ copyHint: "" });
      this.clearCopyHintTimeout = undefined;
    }, 2000);
  };

  public render() {
    const { board, userCount, statusText, roomId, copyHint } = this.state;
    const [width, height] = BoardLayoutService.getDimensions(board);
    const cellSize = BoardLayoutService.getCellSize(width, height);

    const boardStyle: CSSProperties = {
      gridTemplateColumns: `repeat(${width}, var(--cell-size))`,
      ["--cell-size" as string]: cellSize,
    };

    return (
      <section className="game-ui">
        <div className="toolbar" />

        <div className="game-meta">
          <span>
            Raum:{" "}
            <button type="button" className="room-code" onClick={this.copyRoomLink} title="Raum-Link kopieren">
              <code>{roomId}</code>
            </button>
            {copyHint ? <small className="copy-hint">{copyHint}</small> : undefined}
          </span>
          <span>Spieler online: {userCount}</span>
          <span>Board: {width}×{height}</span>
          <span>Status: {statusText}</span>
        </div>

        <div className="board" style={boardStyle}>
          {board.map((column, x) =>
            column.map((value, y) => (
              <button
                key={`${x}-${y}`}
                type="button"
                className="cell"
                onClick={() => this.handlePrimaryClick(x, y)}
                onContextMenu={(event) => this.handleSecondaryClick(event, x, y)}
                title={`(${x}, ${y})`}
              >
                <img src={`/assets/fields/${value}.png`} alt={`Feldwert ${value}`} draggable={false} />
              </button>
            ))
          )}
        </div>
      </section>
    );
  }
}
