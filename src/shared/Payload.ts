import type {Player} from "./Player";
import type {Command} from "./Command";

export type ServerPayload = {
    type: string;
    cmd?: string;
    board?: number[][];
    userCount?: number;
    gameState?: string;
    users?: Player[];
    myId?: string;
    sysCmds?: Command[];
    isHostPlayer?: boolean;
};