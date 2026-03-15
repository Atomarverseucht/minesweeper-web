import {InvisibleSysCommand} from "../SysCommands";
import type {Controller} from "../../controller";

export class GetNameCmd extends InvisibleSysCommand {
    override readonly cmd: string = "getName";
    override readonly next_ = new MyNameCmd();

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        console.log("server: get names");
        ctrl.specNotify(observerID, "names");
        return undefined;
    }
}

class MyNameCmd extends InvisibleSysCommand {
    override readonly cmd: string = "myName";
    override readonly next_ = new ChangeNameCmd();

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        console.log("server: my name");
        ctrl.specNotify(observerID, "myName");
        return undefined;
    }
}

class ChangeNameCmd extends InvisibleSysCommand {
    override readonly cmd: string = "changeName";
    override readonly next_ = new ListCommandsCmd();

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        console.log("server: changeName");
        ctrl.server.setName(observerID, params[1])
        ctrl.notifyObservers("names");
        ctrl.specNotify(observerID, "myName"); return undefined;
    }
}

class ListCommandsCmd extends InvisibleSysCommand {
    override readonly cmd: string = "listCommands";
    override readonly next_ = undefined;

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        return undefined;
    }
}