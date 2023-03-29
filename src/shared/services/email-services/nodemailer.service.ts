/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import nodemailer from 'nodemailer';

import type { EmailTemplateType } from '../../../constants';
import type { IEmailParams } from '../../../interfaces/email-builder.interface';
import { ApiConfigService } from '../api-config.service';
import { EmailBuilder } from './email.builder';

@Injectable() // TODO: separate ses, smtp
export class NodemailerService {
    constructor(private configService: ApiConfigService, private emailBuilder: EmailBuilder) {}

    public async sendMailNodeMailer(type: EmailTemplateType, params: IEmailParams, to: string[]) {
        const template = this.emailBuilder.build(type, params);

        try {
            // create reusable transporter object using the default SMTP transport
            const transporter = nodemailer.createTransport({
                // TODO: move to env
                host: 'smtp.mailgun.org',
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: '', // generated ethereal user
                    pass: '' // generated ethereal password
                }
            });

            const info = await transporter.sendMail({
                from: 'no-reply@gmail.com', // sender address
                to, // list of receivers
                subject: template.subject, // Subject line
                html: template.message // html body
            });

            return nodemailer.getTestMessageUrl(info);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
