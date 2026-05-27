import {Component, type KeyboardEvent} from "react";
import type {UIState} from "../UIState";

export class NamePanel extends Component {
    public constructor(props: Record<string, never>) {
        super(props);
    }
    private copyClipboard = async (text: string): Promise<void> => {
        await navigator.clipboard.writeText(text)
    }
    private cancelOwnNameEdit = (): void => {
        this.setState((prevState) => ({
            isEditingOwnName: false,
            pendingName: prevState.ownName,
        }));
    };

    private handleOwnNameInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter") {
            event.preventDefault();
            this.saveOwnName();
        }
    };
    private changePendingName = (nextName: string): void => {
        this.setState({ pendingName: nextName });
    };

    private startEditingOwnName = (): void => {
        this.setState((prevState) => ({
            isEditingOwnName: true,
            pendingName: prevState.ownName,
        }));
    };
    private saveOwnName = (): void => {
        const trimmedName = this.state.pendingName.trim();
        const safeName = trimmedName.replace(/\s+/g, " ");

        this.state.socket?.send(`changeName ${safeName}`);
        this.setState({
            isEditingOwnName: false,
            statusText: "Name change sent.",
        });
    };

    public render() {
        const {playerNames, ownName, pendingName, isEditingOwnName} = this.state;
        return (
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
                    <span title={`Frontend ID: ${player.player.id}`} onClick={() => this.copyClipboard(player.player.id)}>
                        {player.player.name}{player.isSelf ? " (you)" : ""} {"♥️".repeat(player.player.lifes)}</span>
                            </li>
                        ))}
                    </ul>
                ): (
                    <p className="name-empty">No names received yet.</p>
                )}
        </section>)
    }
}