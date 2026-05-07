export class RoomService {
    public static createRoomId(length = 8): string {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
    }

    public static getOrCreateRoomId(): string {
        const url = new URL(window.location.href);
        const queryRoom = url.searchParams.get("room");
        if (queryRoom) {
            return queryRoom;
        }

        const pathRoom = url.searchParams.get("room")!;
        if (pathRoom) {
            return pathRoom;
        }

        const generatedRoomId = RoomService.createRoomId();
        url.searchParams.set("room", generatedRoomId);
        window.history.replaceState({}, "", url.toString());
        return generatedRoomId;
    }

    public static buildRoomLink(roomId: string): string {
        return `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomId)}`;
    }

    public static getParams(): PageParams {
        const url = new URL(window.location.href);
        return {
            page:   url.searchParams.get("page")   ?? "room",
            roomId: url.searchParams.get("room")   ?? "",
            cmd:    url.searchParams.get("cmd")    ?? undefined,
        };
    }
}

export type PageParams = {
    page: string;
    roomId: string;
    cmd?: string;
}
