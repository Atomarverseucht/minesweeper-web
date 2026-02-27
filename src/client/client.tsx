import "./styles.css";
import { Component } from "react";
import { createRoot } from "react-dom/client";
import GameUI from "./components/GameUI";

class App extends Component {
  public render() {
    return (
      <main>
        <h1>
          💣 <a href="https://github.com/Atomarverseucht/minesweeper-web">Minesweeper Web</a>
        </h1>
        <p>
          The web version of <a href="https://github.com/Atomarverseucht/minesweeper">Atoms and Guakocius Minesweeper project</a>.
        </p>
        <GameUI />
      </main>
    );
  }
}

createRoot(document.getElementById("app")!).render(<App />);
