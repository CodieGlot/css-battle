import type { Type } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

// custom ApiBody for dto with file
export function ApiBodyWithFile(dto: Type<unknown>, description?: string) {
    return applyDecorators(
        ApiConsumes('multipart/form-data'),
        ApiBody({
            description,
            schema: {
                allOf: [
                    {
                        $ref: getSchemaPath(dto),
                        nullable: true
                    },
                    {
                        properties: {
                            file: {
                                type: 'string',
                                format: 'binary'
                            }
                        }
                    }
                ]
            }
        }),
        ApiExtraModels(dto)
    );
}
