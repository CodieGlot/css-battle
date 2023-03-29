/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SendEmailRequest } from '@aws-sdk/client-ses';

export interface IEmailRequestProps {
    email: string[];
    message: {
        charset?: string;
        data: string;
    };
    subject: {
        charset?: string;
        data: string;
    };
    source: string;
}

export class EmailRequestBuilder {
    public request: Record<any, any> = {};

    setDestination(email: string[]): EmailRequestBuilder {
        this.request.Destination = { ToAddresses: email };

        return this;
    }

    setBBCDestination(email: string[]): EmailRequestBuilder {
        this.request.Destination = { BccAddresses: email };

        return this;
    }

    setMessage(message: { data: string; charset?: string }): EmailRequestBuilder {
        if (this.request.Message === undefined) {
            this.request.Message = {};
        }

        this.request.Message.Body = {
            Html: { Charset: message.charset ?? 'utf8', Data: message.data }
        };

        return this;
    }

    setSubject(subject: { data: string; charset?: string }): EmailRequestBuilder {
        if (this.request.Message === undefined) {
            this.request.Message = {};
        }

        const embedded = Object.assign(this.request.Message, {
            Subject: {
                Charset: subject.charset ?? 'utf8',
                Data: subject.data
            }
        });

        this.request.Message = embedded;

        return this;
    }

    setSource(source: string): EmailRequestBuilder {
        this.request.Source = source;

        return this;
    }

    build(data: IEmailRequestProps, bbc: boolean): SendEmailRequest {
        const builder = new EmailRequestBuilder();

        if (data.email && bbc) {
            builder.setBBCDestination(data.email);
        }

        if (data.email && !bbc) {
            builder.setDestination(data.email);
        }

        if (data.message) {
            builder.setMessage(data.message);
        }

        if (data.subject) {
            builder.setSubject(data.subject);
        }

        if (data.source) {
            builder.setSource(data.source);
        }

        return builder.request as SendEmailRequest;
    }
}
