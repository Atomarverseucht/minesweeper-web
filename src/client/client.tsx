import "./styles.css";
import { createRoot } from "react-dom/client";
import GameUI from "./components/GameUI";
import Counter from "./components/Counter";

function App() {
  return (
    <main>
      <h1>💣 Minesweeper Web</h1>
      <p>Erste spielbare GUI für das Multiplayer-Minesweeper.</p>
      <GameUI />
      <Counter />
    </main>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
