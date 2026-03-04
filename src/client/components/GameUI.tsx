import { Component, type CSSProperties, type MouseEvent } from "react";
import PartySocket from "partysocket";
import {RoomService} from "../roomService";

type ServerPayload = {
  type: string;
  board?: number[][];
  userCount?: number;
  gameState?: string;
  names?: Array<string | { id?: string; name?: string; isSelf?: boolean }>;
  selfId?: string;
  yourId?: string;
  ownId?: string;
  myId?: string;
  selfName?: string;
  yourName?: string;
  ownName?: string;
  myName?: string;
};

type PlayerName = {
  id: string;
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
      statusText: "Connect to server ...",
      roomId: RoomService.getOrCreateRoomId(),
      copyHint: "",
      playerNames: [],
      pendingName: "",
      isEditingOwnName: false,
      ownName: "",
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
      this.setState({ statusText: "Connected!" });
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
        this.setState({ statusText: "🎉 You have won!" });
      } else if (payload.gameState === "lost") {
        this.setState({ statusText: "💥 Game Over!" });
      }

      this.updateNamesFromPayload(payload);
    } catch {
      this.setState({ statusText: "Invalid message from server." });
    }
  }

  private updateNamesFromPayload(payload: ServerPayload): void {
    if (!payload.names && !payload.selfName && !payload.yourName && !payload.ownName && !payload.myName) {
      return;
    }

    const selfId = payload.selfId ?? payload.yourId ?? payload.ownId ?? payload.myId ?? "";
    const explicitOwnName = payload.selfName ?? payload.yourName ?? payload.ownName ?? payload.myName ?? "";
    const rawNames = payload.names ?? [];

    const normalizedNames: PlayerName[] = rawNames.map((entry, index) => {
      if (typeof entry === "string") {
        const isSelf = explicitOwnName ? entry === explicitOwnName : false;
        return { id: `player-${index}`, name: entry, isSelf };
      }

      const entryId = entry.id ?? `player-${index}`;
      const entryName = entry.name ?? "Unknown";
      const isSelfById = selfId ? entryId === selfId : false;
      const isSelfByName = explicitOwnName ? entryName === explicitOwnName : false;
      return {
        id: entryId,
        name: entryName,
        isSelf: Boolean(entry.isSelf) || isSelfById || isSelfByName,
      };
    });

    const ownName = explicitOwnName || normalizedNames.find((entry) => entry.isSelf)?.name || "";

    this.setState((prevState) => ({
      playerNames: normalizedNames,
      ownName,
      pendingName: prevState.isEditingOwnName ? prevState.pendingName : ownName,
    }));
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
      this.setState({ copyHint: "copy success" });
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

    this.socket?.send(`name ${safeName}`);
    this.setState({
      ownName: safeName,
      isEditingOwnName: false,
      statusText: "Name updated.",
    });
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
            Raum:{" "}
            <button type="button" className="room-code" onClick={this.copyRoomLink} title="copy room-link">
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
                <img src={`/assets/fields/${value}.png`} alt={`Feldwert ${value}`} draggable={false} />
              </button>
            ))
          )}
        </div>

        <section className="name-panel" aria-label="Spielernamen">
          <h2>Spieler</h2>
          {playerNames.length ? (
            <ul className="name-list">
              {playerNames.map((player) => (
                <li key={player.id}>
                  {player.isSelf ? (
                    isEditingOwnName ? (
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
                      <button type="button" className="own-name" onClick={this.startEditingOwnName} title="Klicken zum Bearbeiten">
                        {player.name} (du)
                      </button>
                    )
                  ) : (
                    <span>{player.name}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="name-empty">Noch keine Namen empfangen.</p>
          )}
          {!playerNames.some((player) => player.isSelf) && ownName ? (
            <p className="name-empty">Dein Name: {ownName}</p>
          ) : undefined}
        </section>
      </section>
    );
  }
}
