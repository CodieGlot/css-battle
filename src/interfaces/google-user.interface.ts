export interface IGoogleUser {
    aud: string;

    user_id?: string;

    scopes: string[];

    expiry_date: number;

    sub?: string;

    azp?: string;

    access_type?: string;

    email: string;

    email_verified?: boolean;
}
