import { applyDecorators, BadRequestException, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

export function ArrayImageFilesLimits(number: number) {
    return applyDecorators(
        UseInterceptors(
            FilesInterceptor('files', number, {
                limits: {
                    fileSize: 1024 * 1024 * 10,
                    files: number
                },
                fileFilter: (req, file, cb) => {
                    if (
                        file.mimetype !== 'application/octet-stream' &&
                        !/image\/(png)$/.test(file.mimetype)
                    ) {
                        cb(new BadRequestException('File does not match requirements'), false);
                    } else {
                        cb(null, true);
                    }
                }
            })
        )
    );
}
