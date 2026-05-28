import { Component, type CSSProperties, type MouseEvent } from "react";
import { RoomService } from "../roomService";
import type { ServerPayload } from "../../shared/Payload";
import { Player } from "../../shared/Player";
import { CookieConsent } from "react-cookie-consent";
import type { Command } from "../../shared/Command";
import type { PlayerName, UIState } from "../UIState";
import { NamePanel } from "./NamePanel";
import { SocketService } from "../SocketService";
import PartySocket from "partysocket";

export class BoardLayoutService {
  public static fallbackBoard(width: number, height: number): number[][] {
    return Array.from({ length: width }, () => Array.from({ length: height }, () => -1));
  }

  public static getDimensions(board: number[][]): [number, number] {
    if (!board.length || !board[0]) return [0, 0];
    return [board.length, board[0].length];
  }

  public static getCellSize(width: number, height: number): string {
    return `min(calc((100vw - 5rem) / ${width}), calc((100vh - 16rem) / ${height}))`;
  }
}

export default class GameUI extends Component<Record<string, never>, UIState> {
  private readonly socketService = new SocketService();
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
      ownName: "(no name set)",
      ownId: "...",
      sysCmds: [],
    };
  }

  public componentDidMount(): void {
    this.connectSocket();
  }

  public componentWillUnmount(): void {
    if (this.state.socket) {
      this.socketService.disconnect(this.state.socket);
      this.setState({ socket: undefined });
    }
    if (this.clearCopyHintTimeout !== undefined) {
      window.clearTimeout(this.clearCopyHintTimeout);
      this.clearCopyHintTimeout = undefined;
    }
  }

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

  private setOwnName(nextOwnName: string): void {
    this.setState((prevState) => ({
      ownName: nextOwnName,
      pendingName: prevState.isEditingOwnName ? prevState.pendingName : nextOwnName,
      playerNames: prevState.playerNames.map((entry) => {
        if (entry.isSelf) return { ...entry, name: nextOwnName, isSelf: true };
        return { ...entry, isSelf: entry.player.name === nextOwnName };
      }),
    }));

    if (this.state.socket) {
      this.socketService.saveName(this.state.socket, nextOwnName);
    }
  }

  private applyNames(rawNames: Player[]): void {
    const normalizedNames: PlayerName[] = rawNames.map((player): PlayerName => ({
      isSelf: player.name === this.state.ownName,
      player,
    }));

    this.setState((prevState) => ({ ...prevState, playerNames: normalizedNames }));
  }

  private sendTurn(command: string, x: number, y: number): void {
    this.state.socket?.send(`${command} ${x} ${y}`);
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

  private handleSysCommand(cmd: Command): void {
    if (!cmd.hasCmdLine) {
      this.state.socket!.send(`${cmd.cmd}`);
    } else {
      this.setState({ cmdLine: cmd });
    }
  }

  private handleSpecSysCommand(cmd: string, params: string): void {
    const outString = cmd + " " + params.replace(cmd, "");
    this.state.socket!.send(outString);
    this.setState({ cmdLine: undefined });
  }

  public render() {
    const { board, userCount, statusText, roomId, copyHint, cmdLine } = this.state;
    const [height, width] = BoardLayoutService.getDimensions(board);
    const cellSize = BoardLayoutService.getCellSize(width, height);
    const boardStyle: CSSProperties = {
      display: "grid",
      gridTemplateColumns: `repeat(${width}, ${cellSize})`,
      gridTemplateRows: `repeat(${height}, ${cellSize})`,
      ["--cell-size" as string]: cellSize,
    };

    return (
      <section className="game-ui">
        <div className="game-meta">
          <span>
            Room:{" "}
            <button type="button" className="room-code visibleButton" onClick={this.copyRoomLink} title="copy room link">
              <code>{roomId}</code>
            </button>
            {copyHint ? <small className="copy-hint">{copyHint}</small> : undefined}
          </span>
          <span>Players online: {userCount}</span>
          <span>Board: {width}×{height}</span>
          <span>Status: {statusText}</span>
        </div>

        <div className="toolbar">
          {this.state.sysCmds.map((cmd) => (
            <button
              key={cmd.cmd}
              className={cmd.isPrivileged ? "privileged" : "unprivileged"}
              title={cmd.helpMsg}
              onClick={() => this.handleSysCommand(cmd)}
            >
              {cmd.cmd}
            </button>
          ))}
        </div>

        <section id="gridCmdLine">
          <div className="board" style={boardStyle}>
            {board.map((column, x) =>
              column.map((value, y) => (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  id={`field(${x}, ${y})`}
                  className="cell"
                  onClick={() => this.handlePrimaryClick(x, y)}
                  onContextMenu={(event) => this.handleSecondaryClick(event, x, y)}
                  title={`(${x}, ${y})`}
                >
                  <img src={`/assets/fields/${value}.png`} alt={`Cell value ${value}`} draggable={false} />
                </button>
              ))
            )}
          </div>

          {cmdLine ? (
            <section id="secCmdLine">
              <p className="allowNewLine">{cmdLine.specHelpMsg}</p>
              <section>
                <input
                  id="cmdLine"
                  type="text"
                  value={this.state.cmdLineContent}
                  onChange={(event) => this.setState({ cmdLineContent: event.target.value })}
                  onKeyDown={(key) =>
                    key.key === "Enter"
                      ? this.handleSpecSysCommand(cmdLine.cmd, this.state.cmdLineContent ?? "")
                      : null
                  }
                />
                <button onClick={() => this.handleSpecSysCommand(cmdLine.cmd, this.state.cmdLineContent ?? "")}>
                  Submit
                </button>
              </section>
            </section>
          ) : null}
        </section>
      </section>
    );
  }
}
