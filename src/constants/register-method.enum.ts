export enum RegisterMethod {
    REGISTER = 'REGISTER',
    GOOGLE = 'GOOGLE',
    APPLE = 'APPLE'
}

export type RegisterType = keyof typeof RegisterMethod;
