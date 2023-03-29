export enum Token {
    ACCESS_TOKEN = 'ACCESS_TOKEN',
    REFRESH_TOKEN = 'REFRESH_TOKEN'
}

export type TokenType = keyof typeof Token;
