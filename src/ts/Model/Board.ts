export class Board {
    public readonly board: readonly (readonly Field[])[]
    constructor(board: readonly(readonly Field[])[]) {
        this.board = board;
    }

    public getBombNeighbour(x: number, y: number): number {
        let count = 0;
        for (let vx = -1; vx <= 1; vx++) {
            for (let vy = -1; vy <= 1; vy++) {
                const nx = x + vx;
                const ny = y + vy;
                if (this.in(nx, ny) && this.board[nx][ny].isBomb) {
                    count++;
                }
            }
        }
        return count;
    }

    public getField(x: number, y: number): number {
        const f = this.getFieldAt(x, y);
        if (f.isFlag) return -3;
        if (!f.isOpened) return -1;
        if (f.isBomb) return -2;
        return this.getBombNeighbour(x, y);
    }

    public getFieldAt(x: number, y: number): Field {
        if (!this.in(x, y)) throw new Error("Coordinates out of range");
        return this.board[x][y];
    }

    public getSize(): [number, number] {
        return [this.board.length, this.board[0]?.length || 0];
    }

    getBoard(): number[][] {
        return this.board.map((row, x) =>
            row.map((_, y) => this.getField(x, y))
        );
    }

    public in(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.board.length && y < this.board[0].length;
    }

    public updateField(indX: number, indY: number, field: Field): Board {
        // Immutables Update via Map/Spread
        const newBoard = this.board.map((row, x) =>
            x === indX ? row.map((f, y) => (y === indY ? field : f)) : row
        );
        return new Board(newBoard);
    }

    public isVictory(): boolean {
        return this.board.every(row =>
            row.every(f => f.isBomb || f.isOpened)
        );
    }

    public toString(): string {
        return this.board.map(row => row.join(", ")).join("\n");
    }

    // Statische "Object" Methoden
    static maxBombs(xSize: number, ySize: number): number {
        return xSize * ySize - 9;
    }

    private static isNeighbour(x0: number, y0: number, x1: number, y1: number): boolean {
        return Math.abs(x0 - x1) <= 1 && Math.abs(y0 - y1) <= 1;
    }

    static create(xSize: number, ySize: number, xStart: number, yStart: number, bombCount: number): Board {
        if (xSize < 10 || ySize < 10) throw new Error("x and y size must be >= 10");
        const isEdge = (size: number, pos: number) => pos === 0 || pos === size - 1;

        let ex = 0;
        if (isEdge(xSize, xStart) && isEdge(ySize, yStart)) ex = 5;
        else if (isEdge(xSize, xStart) || isEdge(ySize, yStart)) ex = 3;

        const bMax = Board.maxBombs(xSize, ySize) + ex;
        if (bombCount < 1 || bombCount > bMax) throw new Error(`Bomb Count must be between 1 and ${bMax}`);

        // Initiale Matrix erstellen
        let currentBoard: Field[][] = Array.from({ length: xSize }, () =>
            Array.from({ length: ySize }, () => new Field(false, true, false))
        );

        return new Board(this.initField(0, 0, xStart, yStart, currentBoard, bombCount, bMax));
    }

    private static initField(
        indx: number, indy: number, xStart: number, yStart: number,
        boardv: Field[][], bombCount: number, fieldCount: number
    ): Field[][] {
        if (fieldCount <= 0) return boardv;

        const isNear = this.isNeighbour(xStart, yStart, indx, indy);
        const isBomb = !isNear && Math.random() * fieldCount < bombCount;

        boardv[indx][indy] = new Field(isBomb, false, false);

        const nextX = indx + 1 < boardv.length ? indx + 1 : 0;
        const nextY = nextX === 0 ? indy + 1 : indy;

        return this.initField(
            nextX, nextY, xStart, yStart, boardv,
            isBomb ? bombCount - 1 : bombCount,
            isNear ? fieldCount : fieldCount - 1
        );
    }
}
