export interface IEmailParams {
    subject: Record<string, string>;
    message: Record<string, string>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ITemplateInput {
    Template: ITemplate;
}
export interface ITemplate {
    TemplateName: string;
    SubjectPart: string | undefined;
    HtmlPart: string | undefined;
    TextPart: string | undefined;
}
