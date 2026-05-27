import {Board} from "./game/Model/Board";
import {Field} from "./game/Model/Field";

export class cmdOut {
    constructor(public readonly isSuccess: boolean, public readonly value: string) {}
}

export const config = {
    standXSize: 10,
    standYSize: 10,
    standBombCount: 10
}

export let bombCount4Generate: number = 10
export function setBC4G(value: number) {bombCount4Generate = value}
export function startBoard(xSize: number = config.standXSize, ySize: number = config.standYSize): Board {
    return new Board(Array.from({ length: xSize }, () =>
        Array.from({ length: ySize }, () => new Field(true, false, false))))
};
