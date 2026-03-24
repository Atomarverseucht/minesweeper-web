import "./styles.css";
import {Component} from "react";
import { createRoot } from "react-dom/client";
import GameUI from "./components/GameUI";
import {version} from "../../package.json";

class App extends Component {
  public render() {
    return (
      <main>
        <h1>
          💣 <a href="https://github.com/Atomarverseucht/minesweeper-web">Minesweeper Web (version {version})</a>
        </h1>
        <p>
          The web version of <a href="https://github.com/Atomarverseucht/minesweeper">Atoms and Guakocius Minesweeper project</a>.
        </p>
        <GameUI />
      </main>
    );
  }
}
document.title = `Minesweeper Web v${version}`;
createRoot(document.getElementById("app")!).render(<App />);
