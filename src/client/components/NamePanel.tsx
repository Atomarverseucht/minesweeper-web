import { type KeyboardEvent } from "react";
import type { NameState } from "../UIState";

interface NamePanelProps {
    state: NameState;
    setState: React.Dispatch<React.SetStateAction<NameState>>;
}

export function NamePanel({ state, setState }: NamePanelProps) {
    const { playerNames, ownName, pendingName, isEditingOwnName } = state;

    const copyClipboard = async (text: string): Promise<void> => {
        await navigator.clipboard.writeText(text);
    };

    const cancelOwnNameEdit = (): void => {
        setState((prev) => ({
            ...prev,
            isEditingOwnName: false,
            pendingName: prev.ownName,
        }));
    };

    const handleOwnNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter") {
            event.preventDefault();
            saveOwnName();
        }
    };

    const changePendingName = (nextName: string): void => {
        setState((prev) => ({ ...prev, pendingName: nextName }));
    };

    const startEditingOwnName = (): void => {
        setState((prev) => ({
            ...prev,
            isEditingOwnName: true,
            pendingName: prev.ownName,
        }));
    };

    const saveOwnName = (): void => {
        const trimmedName = pendingName.trim();
        const safeName = trimmedName.replace(/\s+/g, " ");
        // socket kommt nicht aus NameState – ggf. als Prop ergänzen
        // socket?.send(`changeName ${safeName}`);
        setState((prev) => ({
            ...prev,
            isEditingOwnName: false,
        }));
    };

    return (
        <section className="name-panel" aria-label="Player names">
            <div className="own-name-row">
                <span>Your name:</span>
                {isEditingOwnName ? (
                    <div className="name-edit-row">
                        <input
                            type="text"
                            value={pendingName}
                            onChange={(e) => changePendingName(e.target.value)}
                            onKeyDown={handleOwnNameInputKeyDown}
                            maxLength={32}
                            autoFocus
                        />
                        <button type="button" onClick={saveOwnName}>Save</button>
                        <button type="button" onClick={cancelOwnNameEdit}>Cancel</button>
                    </div>
                ) : (
                    <button type="button" className="own-name visibleButton" onClick={startEditingOwnName} title="Click to edit">
                        {ownName}
                    </button>
                )}
            </div>

            {playerNames.length ? (
                <ul className="name-list">
                    {playerNames.map((player) => (
                        <li key={player.player.name}>
              <span
                  title={`Frontend ID: ${player.player.id}`}
                  onClick={() => copyClipboard(player.player.id)}
              >
                {player.player.name}{player.isSelf ? " (you)" : ""}{" "}
                  {"♥️".repeat(player.player.lifes)}
              </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="name-empty">No names received yet.</p>
            )}
        </section>
    );
}