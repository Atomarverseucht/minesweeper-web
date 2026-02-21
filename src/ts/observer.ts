abstract class Observer {
    public obs: Observable;
    public readonly observerID: number;
    constructor(obs: Observable) {
        this.obs = obs;
        this.observerID = obs.addSub(this);
    }
    public abstract update(): void
    public abstract generate(): void
}

abstract class Observable {
    private obsList: Observer[] = []
    public addSub(observ: Observer): number {
        this.obsList.push(observ);
        return this.obsList.length - 1;
    }
    public removeSub(s: Observer): void {
    }
    public notifyObservers(): void {
        this.obsList.map(o => o.update())
    }
    public generate(subID: number): void {
        this.obsList[subID].generate()
    }
}