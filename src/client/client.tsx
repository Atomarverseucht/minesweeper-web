import "./styles.css";
import { createRoot } from "react-dom/client";
import GameUI from "./components/GameUI";

function App() {
  return (
    <main>
      <h1>💣 Minesweeper Web</h1>
      <p>Erste spielbare GUI für das Multiplayer-Minesweeper.</p>
      <GameUI />
    </main>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
