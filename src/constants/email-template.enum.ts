export enum EmailTemplate {
    DEFAULT = 'DEFAULT',
    FORGOT_PASSWORD_OTP_EMAIL = 'FORGOT_PASSWORD_OTP_EMAIL'
}

export type EmailTemplateType = keyof typeof EmailTemplate;
