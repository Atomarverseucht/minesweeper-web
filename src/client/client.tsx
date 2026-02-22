import "./styles.css";
import { createRoot } from "react-dom/client";
import Counter from "./components/Counter";

function App() {
  return (
    <main>
      <h1>🎈 Welcome to <a href="https://github.com/Atomarverseucht/minesweeper">Minesweeper Web!</a></h1>
      <p>
        This will be the web version of
        <a href="https://github.com/Atomarverseucht/minesweeper">
            Atoms Minesweeper project
        </a>
      </p>
        <p> At this time of production, the only own written code is on the backend, so you have to wait to see something</p>
      <p>
        Read more: <a href="https://docs.partykit.io">PartyKit docs</a>
      </p>
      <p>
        <i>This counter is multiplayer. Try it with multiple browser tabs.</i>
      </p>
      <Counter />
    </main>
  );
}

createRoot(document.getElementById("app")!).render(<App />);
