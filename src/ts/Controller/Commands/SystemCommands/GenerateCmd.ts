import  {SysCommand} from "../SysCommands";
import  {type Controller} from "../../controller";

export class GenerateCmd extends SysCommand {
    override readonly next_: SysCommand = new GenerateCmd();
    override readonly cmd: string = "generate";
    override readonly helpMsg: string = "generates a new Board";
    override readonly specHelpMsg: string = `generate:
  starts the generation of a board

generate <x-size> <y-size> <x-start> <y-start> <bomb-count>:
  generates a board with the given parameters
  
generate <x-size> <y-size> <bomb-count>

generate is not undo-able!`;

    override execute(observerID: number, ctrl: Controller, params: string[]): string | undefined {
        return undefined;
    }
}