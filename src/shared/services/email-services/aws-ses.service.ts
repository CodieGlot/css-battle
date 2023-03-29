/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { SendBulkTemplatedEmailRequest } from '@aws-sdk/client-ses';
import {
    CreateTemplateCommand,
    ListTemplatesCommand,
    SendBulkTemplatedEmailCommand,
    SendEmailCommand,
    SESClient,
    UpdateTemplateCommand
} from '@aws-sdk/client-ses';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import type { EmailTemplateType } from '../../../constants';
import type { IEmailParams, ITemplateInput } from '../../../interfaces/email-builder.interface';
import { ApiConfigService } from '../api-config.service';
import { EmailBuilder } from './email.builder';
import { EmailRequestBuilder } from './email-request.builder';

@Injectable()
export class AwsSESService {
    private readonly sesClient: SESClient;

    private readonly source: string;

    constructor(private configService: ApiConfigService, private emailBuilder: EmailBuilder) {
        const sesConfig = this.configService.awsSesConfig;
        this.sesClient = new SESClient({
            region: sesConfig.sesRegion,
            credentials: {
                accessKeyId: sesConfig.sesAccessKeyId ?? '',
                secretAccessKey: sesConfig.sesSecretAccessKey ?? ''
            }
        });
        this.source = sesConfig.sesSource;
    }

    async sendEmail(type: EmailTemplateType, params: IEmailParams, to: string[], bbc = false) {
        const requestBuilder = new EmailRequestBuilder();

        const template = this.emailBuilder.build(type, params);

        try {
            const request = requestBuilder.build(
                {
                    email: to,
                    message: { data: template.message },
                    subject: { data: template.subject },
                    source: this.source
                },
                bbc
            );
            await this.sesClient.send(new SendEmailCommand(request));
        } catch {
            throw new InternalServerErrorException("Something Bad Happened! Couldn't send the email!");
        }
    }

    async sendBulkEmail(type: EmailTemplateType, params: SendBulkTemplatedEmailRequest) {
        const template = this.emailBuilder.loadTemplate(type);

        await this.createTemplate(type, template?.subject, template?.message, template?.message);

        try {
            return await this.sesClient.send(new SendBulkTemplatedEmailCommand(params));
        } catch (error) {
            throw new Error(error);
        }
    }

    async createTemplate(
        templateName: string,
        subjectPart: string | undefined,
        htmlPart: string | undefined,
        textPart: string | undefined
    ) {
        const template = {
            Template: {
                TemplateName: templateName,
                SubjectPart: subjectPart,
                HtmlPart: htmlPart,
                TextPart: textPart
            }
        };
        const isTemplateExisted = await this.checkTemplateExisted(template.Template.TemplateName);

        await (isTemplateExisted
            ? this.updateTemplate(template)
            : this.sesClient.send(new CreateTemplateCommand(template)));
    }

    async getTemplateList() {
        try {
            const templateList = await this.sesClient.send(new ListTemplatesCommand({}));

            return templateList.TemplatesMetadata;
        } catch (error) {
            throw new Error(error);
        }
    }

    async checkTemplateExisted(templateName: string) {
        const response = await this.getTemplateList();

        if (!response) {
            return false;
        }

        return response.some(({ Name }) => Name === templateName);
    }

    async updateTemplate(template: ITemplateInput) {
        try {
            return await this.sesClient.send(new UpdateTemplateCommand(template));
        } catch (error) {
            throw new Error(error);
        }
    }
}
