import "./styles.css";
import { createRoot } from "react-dom/client";
import GameUI from "./components/GameUI";
import {version} from "../../package.json";
import {CookieConsent} from "react-cookie-consent";
import {NamePanel} from "./components/NamePanel";
import {useEffect} from "react";
import {socketService} from "./SocketService";

function App() {
    useEffect(() => {
        socketService.connect();

        // Ersetzt componentWillUnmount (Clean-up Funktion)
        return () => {
            disconnect();
        };
    }, []);
    return (
      <main>
        <h1>
          💣 <a href="https://github.com/Atomarverseucht/minesweeper-web">Minesweeper Web (version {version})</a>
        </h1>
        <p>
          The web version of <a href="https://github.com/Atomarverseucht/minesweeper">Atoms and Guakocius Minesweeper project</a>.
        </p>
        <GameUI />
        <NamePanel />
        <CookieConsent location="bottom" buttonText="I understand" overlay >
          This website uses cookies to to enhance the user experience. Only technically necessary cookies are used.
        </CookieConsent>
      </main>
    );
  }
document.title = `Minesweeper Web v${version}`;
createRoot(document.getElementById("app")!).render(<App />);
