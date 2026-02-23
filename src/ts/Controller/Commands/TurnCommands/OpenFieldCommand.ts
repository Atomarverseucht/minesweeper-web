import {TurnCommand} from "../commandInterfaces";
import type {cmdOut} from "../../../config";

export class OpenFieldCommand extends TurnCommand{
    override readonly cmd = "open";
    override readonly helpMsg = "opens a field";
    override readonly next_ = undefined;
    override readonly specHelpMsg = "";
    readonly isFlag = this.ctrl.gb.getFieldAt(this.x, this.y).isFlag;

    override doStep(): cmdOut {
        return this.step(true);
    }

    override redoStep(): cmdOut {
        return this.step(true);
    }

    override undoStep(): cmdOut{
        return this.step(false);
    }
    private step(discover: boolean): cmdOut {
        const gb = this.ctrl.gb;
        const f = gb.getFieldAt(this.x, this.y);

        if (discover === f.isOpened) {
            return [false, "Field is already open"];
        }

        // Feld aktualisieren
        this.ctrl.gb = gb.updateField(
            this.x,
            this.y,
            new Field(f.isBomb, discover, !discover && this.isFlag)
        );

        // Statusänderungen
        if (!discover && !this.ctrl.inGame) {
            this.ctrl.changeState("running");
        }

        if (f.isBomb && discover) {
            this.ctrl.changeState("lost");
        } else if (gb.getBombNeighbour(this.x, this.y) === 0) {
            for (let fx = this.x - 1; fx <= this.x + 1; fx++) {
                for (let fy = this.y - 1; fy <= this.y + 1; fy++) {
                    if (gb.in(fx, fy) && !gb.getFieldAt(fx, fy).isOpened === discover) {
                        new OpenFieldCommand(this.ctrl, this.observerID, fx, fy).step(discover);
                    }
                }
            }
        }

        if (discover && this.ctrl.isVictory() && !f.isBomb) {
            this.ctrl.changeState("win");
        }

        return [true, "Open command successfully!"];
    }

}