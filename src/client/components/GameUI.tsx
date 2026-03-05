import { Component, type CSSProperties, type MouseEvent } from "react";
import PartySocket from "partysocket";
import { RoomService } from "../roomService";

type ServerPayload = {
  type?: string;
  cmd?: string;
  board?: number[][];
  userCount?: number;
  gameState?: string;
  users?: unknown;
  myName?: string;
};

type PlayerName = {
  name: string;
  isSelf: boolean;
};

type GameUIState = {
  board: number[][];
  userCount: number;
  statusText: string;
  roomId: string;
  copyHint: string;
  playerNames: PlayerName[];
  pendingName: string;
  isEditingOwnName: boolean;
  ownName: string;
};

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
    return `min(calc((100vw - 5rem) / ${safeWidth}), calc((100vh - 16rem) / ${safeHeight}))`;
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
      statusText: "Connecting to server...",
      roomId: RoomService.getOrCreateRoomId(),
      copyHint: "",
      playerNames: [],
      pendingName: "...",
      isEditingOwnName: false,
      ownName: "...",
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
      this.setState({ statusText: "Connected." });
      this.socket?.send("myName");
      this.socket?.send("getNames");
    });

    this.socket.addEventListener("message", (event: MessageEvent) => {
      this.handleServerMessage(event.data);
    });
  }

  private handleServerMessage(rawPayload: unknown): void {
    if (typeof rawPayload !== "string") {
      return;
    }

    try {
      const payload = JSON.parse(rawPayload) as ServerPayload;
      this.handleJsonPayload(payload);
    } catch {
      this.handleCommandMessage(rawPayload);
    }
  }

  private handleJsonPayload(payload: ServerPayload): void {
    if (payload.board) {
      this.setState({ board: payload.board });
    }

    if (typeof payload.userCount === "number") {
      this.setState({ userCount: payload.userCount });
      this.ensureFallbackNames(payload.userCount);
    }

    if (payload.gameState === "win") {
      this.setState({ statusText: "🎉 You won!" });
    } else if (payload.gameState === "lost") {
      this.setState({ statusText: "💥 Game over." });
    }

    const cmd = (payload.type ?? "").toLowerCase();

    const ownNameFromPayload = payload.myName;
    if (typeof ownNameFromPayload === "string" && ownNameFromPayload.trim()) {
      this.setOwnName(ownNameFromPayload.trim());
    }

    if (cmd === "myName") {
      this.setOwnName(payload.myName!);
    }

    if ( payload.users !== undefined) {
      this.applyNames(payload.users as string[], payload);
    }
  }

  private handleCommandMessage(rawMessage: string): void {
    const message = rawMessage.trim();
    if (!message) {
      return;
    }

    if (message.startsWith("myName")) {
      const ownName = message.replace(/^myName[:\s]*/i, "").trim();
      if (ownName) {
        this.setOwnName(ownName);
      }
      return;
    }

    if (message.startsWith("getNames") || message.startsWith("notifyNames")) {
      const rawNames = message.replace(/^(getNames|notifyNames)[:\s]*/i, "").trim();
      if (!rawNames) {
        return;
      }

      try {
        this.applyNames(JSON.parse(rawNames));
        return;
      } catch {
        const fallbackList = rawNames
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
        this.applyNames(fallbackList);
        return;
      }
    }

    if (message.startsWith("changeName")) {
      const updatedName = message.replace(/^changeName[:\s]*/i, "").trim();
      if (updatedName) {
        this.setOwnName(updatedName);
      }
      return;
    }

    if (!message.startsWith("{") && !message.includes(" ")) {
      this.setOwnName(message);
    }
  }

  private ensureFallbackNames(userCount: number): void {
    this.setState((prevState) => {
      if (prevState.playerNames.length > 0 || userCount <= 0) {
        return null;
      }

      const fallbackNames: PlayerName[] = Array.from({ length: userCount }, (_, index) => {
        const name = `Player ${index + 1}`;
        const isSelf = prevState.ownName ? prevState.ownName === name : index === 0;
        return { id: `fallback-${index + 1}`, name, isSelf };
      });

      const ownName = prevState.ownName || "Player 1";
      return {
        playerNames: fallbackNames,
        ownName,
        pendingName: prevState.isEditingOwnName ? prevState.pendingName : ownName,
      };
    });
  }

  private setOwnName(nextOwnName: string): void {
    this.setState((prevState) => ({
      ownName: nextOwnName,
      pendingName: prevState.isEditingOwnName ? prevState.pendingName : nextOwnName,
      playerNames: prevState.playerNames.map((entry) => {
        if (entry.isSelf) {
          return { ...entry, name: nextOwnName, isSelf: true };
        }
        return { ...entry, isSelf: entry.name === nextOwnName };
      }),
    }));
  }

  private applyNames(rawNames: string[], payload?: ServerPayload): void {

    const normalizedNames: PlayerName[] = rawNames.map((name): PlayerName => {
      const isSelf = name === this.state.ownName;
      return {
        name,
        isSelf,
      };
    });

    this.setState((prevState) => {
      let newState: GameUIState = prevState
      newState.playerNames = normalizedNames
      return newState;
    });
  }

  private sendTurn(command: string, x: number, y: number): void {
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
      this.setState({ copyHint: "copied" });
    } catch {
      this.setState({ copyHint: "copy failed" });
    }

    if (this.clearCopyHintTimeout !== undefined) {
      window.clearTimeout(this.clearCopyHintTimeout);
    }

    this.clearCopyHintTimeout = window.setTimeout(() => {
      this.setState({ copyHint: "" });
      this.clearCopyHintTimeout = undefined;
    }, 2000);
  };

  private startEditingOwnName = (): void => {
    this.setState((prevState) => ({
      isEditingOwnName: true,
      pendingName: prevState.ownName,
    }));
  };

  private changePendingName = (nextName: string): void => {
    this.setState({ pendingName: nextName });
  };

  private saveOwnName = (): void => {
    const trimmedName = this.state.pendingName.trim();
    const safeName = trimmedName.replace(/\s+/g, "_");
    if (!safeName) {
      this.setState({ isEditingOwnName: false, pendingName: this.state.ownName });
      return;
    }

    this.socket?.send(`changeName ${safeName}`);
    this.setOwnName(safeName);
    this.setState({
      isEditingOwnName: false,
      statusText: "Name change sent.",
    });
    this.socket?.send("getNames");
  };

  private cancelOwnNameEdit = (): void => {
    this.setState((prevState) => ({
      isEditingOwnName: false,
      pendingName: prevState.ownName,
    }));
  };

  public render() {
    const { board, userCount, statusText, roomId, copyHint, playerNames, ownName, pendingName, isEditingOwnName } = this.state;
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
            Room:{" "}
            <button type="button" className="room-code" onClick={this.copyRoomLink} title="copy room link">
              <code>{roomId}</code>
            </button>
            {copyHint ? <small className="copy-hint">{copyHint}</small> : undefined}
          </span>
          <span>Players online: {userCount}</span>
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
                title={`(${x}, ${y})`} >
                <img src={`/assets/fields/${value}.png`} alt={`Cell value ${value}`} draggable={false} />
              </button>
            ))
          )}
        </div>

        <section className="name-panel" aria-label="Player names">
          <h2>Players</h2>
          <div className="own-name-row">
            <span>Your name:</span>
            {isEditingOwnName ? (
              <div className="name-edit-row">
                <input
                  type="text"
                  value={pendingName}
                  onChange={(event) => this.changePendingName(event.target.value)}
                  maxLength={24}
                  autoFocus
                />
                <button type="button" onClick={this.saveOwnName}>Save</button>
                <button type="button" onClick={this.cancelOwnNameEdit}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="own-name" onClick={this.startEditingOwnName} title="Click to edit">
                {ownName || "(no name set)"}
              </button>
            )}
          </div>

          {playerNames.length ? (
            <ul className="name-list">
              {playerNames.map((player) => (
                <li key={player.name}>
                  <span>{player.name}{player.isSelf ? " (you)" : ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="name-empty">No names received yet.</p>
          )}
        </section>
      </section>
    );
  }
}
