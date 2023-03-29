import type { Type } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { PageDto } from '../common/dto/page.dto';

export function ApiPageOkResponse<T extends Type>(options: {
    type: T;
    description?: string;
}): MethodDecorator {
    return applyDecorators(
        ApiExtraModels(PageDto),
        ApiExtraModels(options.type),
        ApiOkResponse({
            description: options.description,
            schema: {
                allOf: [
                    {
                        properties: {
                            status: {
                                type: 'number',
                                example: 200
                            }
                        }
                    },
                    { $ref: getSchemaPath(PageDto) },
                    {
                        properties: {
                            data: {
                                type: 'array',
                                items: { $ref: getSchemaPath(options.type) }
                            }
                        }
                    }
                ]
            }
        })
    );
}
