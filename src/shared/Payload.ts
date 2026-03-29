import type {Player} from "./Player";
import type {Command} from "../server/Controller/Commands/commandInterfaces";

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