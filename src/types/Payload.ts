import type {Player} from "./Player";

export type ServerPayload = {
    type?: string;
    cmd?: string;
    board?: number[][];
    userCount?: number;
    gameState?: string;
    users?: Player[];
    myName?: string;
};