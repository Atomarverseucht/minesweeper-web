import  {SysCommand} from "../SysCommands"
import  {type Controller} from "../../controller"
import {Board} from "../../../Model/Board";
import {Running} from "../../state";

export class GenerateCmd extends SysCommand {
    override readonly next_?: SysCommand = undefined;
    override readonly cmd: string = "generate"
    override readonly helpMsg: string = "generates a new Board"
    override readonly specHelpMsg: string = `generate:
  starts the generation of a board

generate <x-size> <y-size> <x-start> <y-start> <bomb-count>:
  generates a board with the given parameters
  
generate <x-size> <y-size> <bomb-count>

generate is not undo-able!`

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        console.log("generate command")
        try{
            ctrl.gb = Board.create(+params[1], +params[2], +params[3], +params[4], +params[5])
            ctrl.state = new Running(ctrl)
            ctrl.turn(observerID, "open", +params[3], +params[4])
            ctrl.undo.overrideStacks([],[])
            return "Generated!"
        } catch (e) {
            try {
                ctrl.config.bombCount4Generate = +params[3]
                ctrl.gb = ctrl.config.startBoard(+params[1], +params[2])
                ctrl.changeState("start")
                return "Place to generate!"
            } catch (e) {
                ctrl.generate(observerID);
            }
        }
        }

}