class Field {
    public readonly isBomb: boolean;
    public readonly isOpened: boolean;
    public readonly isFlag: boolean;

    constructor(isBomb: boolean, isOpened: boolean, isFlag: boolean) {
        this.isBomb = isBomb;
        this.isOpened = isOpened;
        this.isFlag = isFlag;
    }
}