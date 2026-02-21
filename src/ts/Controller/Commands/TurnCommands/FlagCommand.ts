import {TurnCommand} from "../commandInterfaces";
import type {Controller} from "../../controller";

export class FlagCommand extends TurnCommand{
    override readonly cmd = "flag";
    override helpMsg: string = "flag or unflag the given coordinate";
    readonly next_: TurnCommand = this;
    override specHelpMsg: string = `flag <x> <y>:
mark this position as flag or remove the flag`;

    override doStep(): string {
        return "flag";
    }

    override redoStep(): string {
        return "";
    }

    override undoStep(): string {
        return "";
    }
}