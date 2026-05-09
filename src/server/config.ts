import {Board} from "./game/Model/Board";
import {Field} from "./game/Model/Field";

export class cmdOut {
    constructor(public readonly isSuccess: boolean, public readonly value: string) {}
}
export class Config {
    public bombCount4Generate: number = 10;
    readonly standXSize: number = 10;
    readonly standYSize: number = 10;
    public startBoard(xSize: number, ySize: number): Board {
        return new Board(Array.from({ length: xSize }, () =>
            Array.from({ length: ySize }, () => new Field(true, false, false))))
    }

}
