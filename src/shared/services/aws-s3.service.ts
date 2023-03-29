import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import mime from 'mime-types';

import type { IFile } from '../../interfaces';
import { GeneratorProvider } from '../../providers';
import { ApiConfigService } from './api-config.service';
import { GeneratorService } from './generator.service';

@Injectable()
export class AwsS3Service {
    private readonly s3Client: S3Client;

    private readonly bucketName: string;

    private readonly expiresIn: number;

    constructor(public configService: ApiConfigService, public generatorService: GeneratorService) {
        const s3Config = this.configService.awsS3Config;

        this.s3Client = new S3Client({
            region: s3Config.bucketRegion,
            credentials: {
                accessKeyId: s3Config.s3AccessKeyId,
                secretAccessKey: s3Config.s3SecretAccessKey
            }
        });

        this.bucketName = s3Config.bucketName;
        this.expiresIn = 36_000;
    }

    async uploadImage(file: IFile) {
        const fileName = this.generatorService.fileName(<string>mime.extension(file.mimetype));
        const key = this.configService.awsS3Config.bucketEndpoint + 'images/' + fileName;

        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Body: file.buffer,
                ContentType: file.mimetype,
                Key: 'images/' + fileName,
                ACL: 'public-read'
            })
        );

        return key;
    }

    getSignedUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });

        return getSignedUrl(this.s3Client, command, {
            expiresIn: this.expiresIn
        });
    }

    async deleteObject(key: string) {
        if (this.validateRemovedImage(key)) {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key
                })
            );
        }
    }

    async deleteObjects(keys: string[]) {
        const promiseDelete = keys.map((item) => {
            const oldKey = GeneratorProvider.getS3Key(item);

            if (oldKey && this.validateRemovedImage(oldKey)) {
                return this.s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: this.bucketName,
                        Key: oldKey
                    })
                );
            }
        });

        await Promise.all(promiseDelete);
    }

    validateRemovedImage(key: string) {
        return !key.includes('templates/');
    }
}
