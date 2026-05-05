import type {Player} from "./Player";
import type {Command} from "./AbstractCommand";

export type ServerPayload = {
    type?: string;
    cmd?: string;
    board?: number[][];
    userCount?: number;
    gameState?: string;
    users?: Player[];
    myName?: string;
    sysCmds?: Command[];
};