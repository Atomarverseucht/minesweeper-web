import  {type SysCommand} from "../SysCommands";
import  {type Controller} from "../../controller";

export class GenerateCmd implements SysCommand {
    next_ = undefined;
    readonly cmd: string = "generate";
    readonly helpMsg: string = "generates a new Board";
    readonly specHelpMsg: string = `generate:
  starts the generation of a board

generate <x-size> <y-size> <x-start> <y-start> <bomb-count>:
  generates a board with the given parameters
  
generate <x-size> <y-size> <bomb-count>

generate is not undo-able!`;

    execute(observerID: number, ctrl: Controller, params?: string[]): string | undefined {
        return undefined;
    }


    listCmds(): SysCommand[] {
        return [];
    }
}