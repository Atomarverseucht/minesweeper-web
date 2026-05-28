import type {Command} from "../shared/Command";
import {Player} from "../shared/Player";
import PartySocket from "partysocket";

export type UIState = {
    board: number[][];
    userCount: number;
    statusText: string;
    roomId: string;
    copyHint: string;

    sysCmds: Command[];
    cmdLine?: Command;
    cmdLineContent?: string;
    socket?: PartySocket;
};

export type NameState = {
    pendingName: string;
    isEditingOwnName: boolean;
    ownName: string;
    ownId: string;
    playerNames: PlayerName[];
}
export type PlayerName = {
    isSelf: boolean;
    player: Player;
};