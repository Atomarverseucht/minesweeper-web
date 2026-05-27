import type {Command} from "../shared/Command";
import {Player} from "../shared/Player";
import PartySocket from "partysocket";

export type UIState = {
    board: number[][];
    userCount: number;
    statusText: string;
    roomId: string;
    copyHint: string;
    playerNames: PlayerName[];
    pendingName: string;
    isEditingOwnName: boolean;
    ownName: string;
    ownId: string;
    sysCmds: Command[];
    cmdLine?: Command;
    cmdLineContent?: string;
    socket?: PartySocket;
};

export type PlayerName = {
    isSelf: boolean;
    player: Player;
};