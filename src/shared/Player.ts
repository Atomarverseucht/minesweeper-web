export class Player {
    public name: string;
    public lifes: number;
    public isOnline: boolean;
    constructor(name: string) {
        this.name = name;
        this.lifes = 3;
        this.isOnline = true;
    }

}