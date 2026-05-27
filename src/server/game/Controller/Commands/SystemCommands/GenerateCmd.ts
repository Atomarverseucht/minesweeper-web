import  {SysCommand} from "../SysCommands"
import {Board} from "../../../Model/Board";
import {Running} from "../../state";
import {GetNameCmd} from "./NameCmds";
import {bombCount4Generate, setBC4G, startBoard} from "../../../../config";

class GenerateCmd extends SysCommand {
    override readonly next_?: SysCommand = new GetNameCmd(this.ctrl);
    override readonly cmd: string = "generate"
    override readonly helpMsg: string = "generates a new Board"
    override readonly visible: boolean = true
    override readonly hasCmdLine = true
    override readonly isPrivileged: boolean = true
    override readonly specHelpMsg: string = `generate:
  starts the generation of a board

generate <x-size> <y-size> <x-start> <y-start> <bomb-count>:
  generates a board with the given parameters
  
generate <x-size> <y-size> <bomb-count>

generate is not undo-able!`

    override execute(observerID: string, params: string[]): string | undefined {
        console.log("generate command")
        const ctrl = this.ctrl
        try{
            ctrl.gb = Board.create(+params[1], +params[2], +params[3], +params[4], +params[5])
            ctrl.state = new Running(ctrl)
            ctrl.turn(observerID, "open", +params[3], +params[4])
            ctrl.undo.overrideStacks([],[])
            ctrl.notifyObservers()
            return "Generated!"
        } catch (e) {
            try {
                setBC4G(+params[3])
                ctrl.gb = startBoard(+params[1], +params[2])
                ctrl.changeState("start")
                ctrl.notifyObservers()
                return "Place to generate!"
            } catch (e) {
                return undefined;
            }
        }
    }
}

export default GenerateCmd