import { useMemo, useState } from "react";
import usePartySocket from "partysocket/react";

type ServerPayload = {
  type: "update" | "init" | "generate";
  board?: number[][];
  userCount?: number;
  gameState?: string;
};

type ToolMode = "open" | "flag";

const fallbackBoard = (width: number, height: number): number[][] =>
  Array.from({ length: width }, () => Array.from({ length: height }, () => -1));

export default function GameUI() {
  const [board, setBoard] = useState<number[][]>(fallbackBoard(10, 10));
  const [userCount, setUserCount] = useState<number>(0);
  const [toolMode, setToolMode] = useState<ToolMode>("open");
  const [statusText, setStatusText] = useState<string>("Verbinde zum Spielserver ...");

  const socket = usePartySocket({
    room: "example-game-room",
    onOpen() {
      setStatusText("Verbunden. Du kannst jetzt spielen.");
    },
    onMessage(evt) {
      console.log("RAW MESSAGE:", evt.data);
      try {
        console.log("Message received");
        const payload = JSON.parse(evt.data as string) as ServerPayload;
        if (payload.board) {
          setBoard(payload.board);
        }
        if (typeof payload.userCount === "number") {
          setUserCount(payload.userCount);
        }
        if (payload.gameState === "win") {
          setStatusText("🎉 Du hast gewonnen!");
        } else if (payload.gameState === "lost") {
          setStatusText("💥 Game Over!");
        }
      } catch {
        console.error("lul");
      }
    },
  });

  const [width, height] = useMemo(() => {
    if (!board.length || !board[0]) return [0, 0];
    return [board.length, board[0].length];
  }, [board]);

  const sendTurn = (cmd: ToolMode, x: number, y: number) => {
    socket.send(`${cmd} ${x} ${y}`);
  };

  const handlePrimaryClick = (x: number, y: number) => {
    sendTurn("open", x, y);
  };

  const handleSecondaryClick = (x: number, y: number) => {
    sendTurn("flag", x, y);
  };

  return (
    <section className="game-ui">
      <div className="toolbar">
      </div>

      <div className="game-meta">
        <span>Spieler online: {userCount}</span>
        <span>Board: {width}×{height}</span>
        <span>Status: {statusText}</span>
      </div>

      <div
        className="board"
        style={{ gridTemplateColumns: `repeat(${width}, minmax(26px, 36px))` }}
      >
        {board.map((column, x) =>
          column.map((value, y) => (
            <button
              key={`${x}-${y}`}
              type="button"
              className="cell"
              onClick={() => handlePrimaryClick(x, y)}
              onContextMenu={(event) => {
                event.preventDefault();
                handleSecondaryClick(x, y);
              }}
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
