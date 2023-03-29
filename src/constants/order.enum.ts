export enum Order {
    ASC = 'ASC',
    DESC = 'DESC'
}

export type OrderType = keyof typeof Order;
