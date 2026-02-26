import {TurnCommand} from "../commandInterfaces";
import type {Controller} from "../../controller";
import {OpenFieldCommand} from "./OpenFieldCommand";
import {cmdOut} from "../../../config";
import {Field} from "../../../Model/Field";

export class FlagCommand extends TurnCommand{
    override readonly cmd = "flag";
    override helpMsg = "flag or unflag the given coordinate";
    readonly next_?: TurnCommand = OpenFieldCommand.create(this);
    override specHelpMsg = `flag <x> <y>:
mark this position as flag or remove the flag`;

    override doStep(): cmdOut {
        const f = this.ctrl.gb.getFieldAt(this.x, this.y);
        if (!f.isOpened) {
            this.ctrl.gb = this.ctrl.gb.updateField(this.x, this.y,
                new Field(f.isBomb, f.isOpened, !f.isFlag));
            return new cmdOut(true, "");
        } else {
            // Fehlerbehandlung
            return new cmdOut(false, "flag cannot be set on a opened field")
        }
    }

    override redoStep(): cmdOut {
        return this.doStep();
    }

    override undoStep(): cmdOut {
        return this.doStep();
    }
}