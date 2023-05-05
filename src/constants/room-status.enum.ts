export enum RoomStatus {
    OPEN = 'OPEN',
    PROGRESS = 'PROGRESS',
    CLOSED = 'CLOSED'
}

export type RommStatusType = keyof typeof RoomStatus;
