import {Component, type CSSProperties, type KeyboardEvent, type MouseEvent} from "react";
import PartySocket from "partysocket";
import {RoomService} from "../roomService";
import type {ServerPayload} from "../../shared/Payload";
import {Player} from "../../shared/Player";
import {Cookies} from "react-cookie"
import {CookieConsent} from "react-cookie-consent";
import type {CookieData} from "../../shared/CookieData";
import {v4 as uuid4} from "uuid";
import type {Command} from "../../shared/AbstractCommand";

type PlayerName = {
  isSelf: boolean;
  player: Player;
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
  ownId: string;
  sysCmds: Command[];
  cmdLine?: Command;
  cmdLineContent?: string;
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
    return `min(calc((100vw - 5rem) / ${width}), calc((100vh - 16rem) / ${height}))`;
  }
}

export default class GameUI extends Component<Record<string, never>, GameUIState> {
  private socket?: PartySocket = undefined;
  readonly cookie = new Cookies();
  readonly initialCookie? = this.cookie.get<CookieData>("minesweeper-web")
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

    // generate uuid if not set via cookie
    let id: string;
    let myName: string | undefined = undefined;
    if (this.initialCookie) {
      id = this.initialCookie.clientID;
      myName = this.initialCookie.playerName;
      console.log(myName);
    } else {
      id = uuid4();
    }

    this.socket = new PartySocket({
      host: window.location.host,
      room: this.state.roomId,
      maxRetries: 0,
      id: id,
      query: {
        name: myName
      }
    });

    this.socket.addEventListener("open", () => {
      this.setState({ statusText: "Connected." });
    });

    this.socket.addEventListener("message", (event: MessageEvent) => {
      this.handleServerMessage(event.data);
    });
  }

  private handleServerMessage(rawPayload: any): void {
    if (typeof rawPayload !== "string") {
      return;
    }
    try {
      const payload: ServerPayload = JSON.parse(rawPayload);
      this.handleJsonPayload(payload);
    } catch (e: any) {
      if (e as Error) {
        console.log((e as Error).message);
      }
    }
  }

  private handleJsonPayload(payload: ServerPayload): void {
    if (payload.board) {
      this.setState({ board: payload.board });
    }

    if (payload.userCount) {
      this.setState({ userCount: payload.userCount });
    }

    if (payload.gameState === "win") {
      this.setState({ statusText: "🎉 You won!" });
    } else if (payload.gameState === "lost") {
      this.setState({ statusText: "💥 Game over." });
    }
    if (payload.sysCmds) {
      this.setState({sysCmds: payload.sysCmds})
    }
    if (payload.myId) {
      this.setState({ ownId: payload.myId });
    }
    if (payload.users) {
      this.applyNames(payload.users);
      this.setOwnName(payload.users.find(p => p.id === this.state.ownId)?.name ?? "ERRÖR")
    }
  }

  private setOwnName(nextOwnName: string): void {
    this.setState((prevState) => ({
      ownName: nextOwnName,
      pendingName: prevState.isEditingOwnName ? prevState.pendingName : nextOwnName,
      playerNames: prevState.playerNames.map((entry) => {
        if (entry.isSelf) {
          return { ...entry, name: nextOwnName, isSelf: true };
        }
        return { ...entry, isSelf: entry.player.name === nextOwnName };
      }),
    }));
    const cdata: CookieData = {clientID: this.socket!.id, playerName: nextOwnName};
    this.cookie.set("minesweeper-web", cdata);
  }

  private applyNames(rawNames: Player[]): void {
    const normalizedNames: PlayerName[] = rawNames.map((player): PlayerName => {
      const isSelf = player.name === this.state.ownName;
      console.log(player.name)
      return {
        isSelf,
        player
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
    const safeName = trimmedName.replace(/\s+/g, " ");

    this.socket?.send(`changeName ${safeName}`);
    this.setState({
      isEditingOwnName: false,
      statusText: "Name change sent.",
    });
  };

  private handleOwnNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      this.saveOwnName();
    }
  };

  private cancelOwnNameEdit = (): void => {
    this.setState((prevState) => ({
      isEditingOwnName: false,
      pendingName: prevState.ownName,
    }));
  };

  private handleSysCommand(cmd: Command): void {
    if (!cmd.hasCmdLine) {
      this.socket!.send(`${cmd.cmd}`);
    } else {
      this.setState({cmdLine: cmd})
    }
  }

  private handleSpecSysCommand(cmd: string, params: string): void {
    let outString = cmd + " " + params;
    this.socket!.send(outString);
  }

  public render() {
    const { board, userCount, statusText, roomId, copyHint, playerNames, ownName, pendingName, isEditingOwnName, cmdLine } = this.state;
    const [width, height] = BoardLayoutService.getDimensions(board);
    const cellSize = BoardLayoutService.getCellSize(width, height);

    const boardStyle: CSSProperties = {
      gridTemplateColumns: `repeat(${width}, var(--cell-size))`,
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
              <button title={cmd.helpMsg} onClick={() => this.handleSysCommand(cmd)}> {cmd.cmd} </button>
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
                  title={`(${x}, ${y})`} >
                  <img src={`/assets/fields/${value}.png`} alt={`Cell value ${value}`} draggable={false} />
                </button>
              ))
            )}
          </div>
          { cmdLine ?
              <section id="secCmdLine">
                <label className="allowNewLine">{cmdLine.specHelpMsg}</label>
                <input id="cmdLine" value={this.state.cmdLineContent} onChange={event => this.setState({ cmdLineContent: event.target.value })}/>
                <button
                    onClick={() => this.handleSpecSysCommand(cmdLine.cmd, this.state.cmdLineContent ?? "")}
                ></button>
              </section> : null
          }
        </section>
        <section className="name-panel" aria-label="Player names">
          <div className="own-name-row">
            <span>Your name:</span>
            {isEditingOwnName ? (
              <div className="name-edit-row">
                <input
                  type="text"
                  value={pendingName}
                  onChange={(event) => this.changePendingName(event.target.value)}
                  onKeyDown={this.handleOwnNameInputKeyDown}
                  maxLength={32}
                  autoFocus
                />
                <button type="button" onClick={this.saveOwnName}>Save</button>
                <button type="button" onClick={this.cancelOwnNameEdit}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="own-name visibleButton" onClick={this.startEditingOwnName} title="Click to edit">
                {ownName}
              </button>
            )}
          </div>

          {playerNames.length ? (
            <ul className="name-list">
              {playerNames.map((player) => (
                <li key={player.player.name}>
                  <span>{player.player.name}{player.isSelf ? " (you)" : ""} {"♥️".repeat(player.player.lifes)}</span>
                </li>
              ))}
            </ul>
          ): (
            <p className="name-empty">No names received yet.</p>
          )}
        </section>
          <CookieConsent location="bottom" buttonText="I understand" overlay >
          This website uses cookies to to enhance the user experience. Only technically necessary cookies are used.
        </CookieConsent>
      </section>
    );
  }
}
