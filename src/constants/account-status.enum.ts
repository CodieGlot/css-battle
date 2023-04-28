export enum AccountStatus {
    CREATED = 'CREATED',
    CONFLICT = 'CONFLICT'
}

export type AccountStatusType = keyof typeof AccountStatus;
