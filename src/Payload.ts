export type ServerPayload = {
    type?: string;
    cmd?: string;
    board?: number[][];
    userCount?: number;
    gameState?: string;
    users?: string[];
    myName?: string;
};