import { ApiProperty } from '@nestjs/swagger';

import type { AbstractEntity } from '../abstract.entity';

export class AbstractDto {
    // TODO: implement snowflake id
    @ApiProperty({ example: '000000x0-00x0-0000-000x-xx0xx00x000x' })
    id: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    deletedAt: Date;

    constructor(entity: AbstractEntity, options?: { excludeFields?: boolean }) {
        if (!options?.excludeFields) {
            this.id = entity.id;
            this.createdAt = entity.createdAt;
            this.updatedAt = entity.updatedAt;
        }
    }
}
