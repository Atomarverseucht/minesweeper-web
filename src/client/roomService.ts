const ROOM_ID_PATTERN = /(?:\?|&|\/)room=([A-Za-z0-9_-]+)/;
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

        const pathRoom = window.location.href.match(ROOM_ID_PATTERN)?.[1];
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
}
