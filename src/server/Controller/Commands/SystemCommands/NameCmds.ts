import {InvisibleSysCommand} from "../SysCommands";
import type {Controller} from "../../controller";
import {RedoCmd} from "./RedoCmd";

export class GetNameCmd extends InvisibleSysCommand {
    override readonly cmd: string = "getName";
    override readonly next_ = new MyNameCmd();

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        console.log("server: get names");
        ctrl.specNotify(observerID, "names");
        return undefined;
    }
}

export class MyNameCmd extends InvisibleSysCommand {
    override readonly cmd: string = "myName";
    override readonly next_ = new ChangeNameCmd();

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        console.log("server: my name");
        ctrl.specNotify(observerID, "myName");
        return undefined;
    }
}

export class ChangeNameCmd extends InvisibleSysCommand {
    override readonly cmd: string = "changeName";
    override readonly next_ = new RedoCmd();

    override execute(observerID: string, ctrl: Controller, params: string[]): string | undefined {
        console.log("server: changeName");
        ctrl.server.setName(observerID, params[1])
        ctrl.notifyObservers("names");
        ctrl.specNotify(observerID, "myName");
        return undefined;
    }
}
