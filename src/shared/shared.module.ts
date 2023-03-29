import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ApiConfigService } from './services/api-config.service';
import { AwsS3Service } from './services/aws-s3.service';
import { AwsSESService } from './services/email-services/aws-ses.service';
import { EmailBuilder } from './services/email-services/email.builder';
import { NodemailerService } from './services/email-services/nodemailer.service';
import { GeneratorService } from './services/generator.service';
import { ValidatorService } from './services/validator.service';

const providers = [
    ApiConfigService,
    ValidatorService,
    AwsS3Service,
    GeneratorService,
    AwsSESService,
    EmailBuilder,
    NodemailerService
];

@Global()
@Module({
    providers,
    imports: [HttpModule, CqrsModule],
    exports: [...providers, HttpModule, CqrsModule]
})
export class SharedModule {}
