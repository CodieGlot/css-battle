export enum PlayerStatus {
    WAITING = 'WAITING',
    READY = 'READY',
    FINISHED = 'FINISHED'
}

export type PlayerStatusType = keyof typeof PlayerStatus;
