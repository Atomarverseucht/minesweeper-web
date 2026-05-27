import {Component, type CSSProperties, type MouseEvent} from "react";
import PartySocket from "partysocket";
import {RoomService} from "../roomService";
import type {ServerPayload} from "../../shared/Payload";
import {Player} from "../../shared/Player";
import {Cookies} from "react-cookie"
import {CookieConsent} from "react-cookie-consent";
import type {CookieData} from "../../shared/CookieData";
import {v4 as uuid4} from "uuid";
import type {Command} from "../../shared/Command";
import type {PlayerName, UIState} from "../UIState";
import {NamePanel} from "./NamePanel";

export class BoardLayoutService {
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

export default class GameUI extends Component<Record<string, never>, UIState> {
  readonly cookie = new Cookies();
  readonly initialCookie? = this.cookie.get<CookieData>("minesweeper-web")
  private clearCopyHintTimeout?: number = undefined;
  readonly namePanel: NamePanel;
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
    this.namePanel = new NamePanel(this.props, this.state)
  }

  public componentDidMount(): void {
    this.connectSocket();
  }

  public componentWillUnmount(): void {
    if (this.state.socket) {
      this.state.socket.close();
      this.setState({socket: undefined}) ;
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
    const socket = new PartySocket({
      host: window.location.host,
      room: this.state.roomId,
      maxRetries: 0,
      id: id,
      query: {
        name: myName
      }
    })
    socket.addEventListener("open", () => {
      this.setState({ statusText: "Connected." });
    });

    socket.addEventListener("message", (event: MessageEvent) => {
      this.handleServerMessage(event.data);
    });
    this.setState({socket: socket})
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
    const cdata: CookieData = {clientID: this.state.socket!.id, playerName: nextOwnName};
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
      let newState: UIState = prevState
      newState.playerNames = normalizedNames
      return newState;
    });
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
      this.setState({cmdLine: cmd})
    }
  }

  private handleSpecSysCommand(cmd: string, params: string): void {
    let outString = cmd + " " + params.replace(cmd, "");
    this.state.socket!.send(outString);
    this.setState({cmdLine: undefined})
  }

  public render() {
    const { board, userCount, statusText, roomId, copyHint, cmdLine } = this.state;
    const [height, width] = BoardLayoutService.getDimensions(board);
    const cellSize = BoardLayoutService.getCellSize(width, height);
    const boardStyle: CSSProperties = {
      display: 'grid',
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
              <button className={cmd.isPrivileged ? "privileged" : "unprivileged"} title={cmd.helpMsg} onClick={() => this.handleSysCommand(cmd)}> {cmd.cmd} </button>
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
              <p className="allowNewLine">{cmdLine.specHelpMsg}</p>
              <section>
                <input id="cmdLine" type="text" value={this.state.cmdLineContent}
                  onChange={event => this.setState({ cmdLineContent: event.target.value })}
                  onKeyDown={(key) => key.key === "Enter" ? this.handleSpecSysCommand(cmdLine.cmd, this.state.cmdLineContent ?? ""):null}/>
                <button
                  onClick={() => this.handleSpecSysCommand(cmdLine.cmd, this.state.cmdLineContent ?? "")}> Submit </button>
              </section>
            </section> : null
          }
        </section>
        {this.namePanel}
          <CookieConsent location="bottom" buttonText="I understand" overlay >
          This website uses cookies to to enhance the user experience. Only technically necessary cookies are used.
        </CookieConsent>
      </section>
    );
  }
}
