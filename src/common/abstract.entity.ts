import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import type { Constructor } from '../types';
import type { AbstractDto } from './dto/abstract.dto';

export interface IAbstractEntity<DTO extends AbstractDto, O = never> {
    id: string;
    createdAt: Date;
    updatedAt: Date;

    toResponseDto(options?: O): DTO;
}

export abstract class AbstractEntity<DTO extends AbstractDto = AbstractDto, O = never>
    implements IAbstractEntity<DTO, O>
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({
        type: 'timestamptz'
    })
    createdAt: Date;

    @UpdateDateColumn({
        type: 'timestamptz'
    })
    updatedAt: Date;

    @DeleteDateColumn({
        type: 'timestamptz'
    })
    deletedAt: Date;

    private dtoClass?: Constructor<DTO, [AbstractEntity, O?]>;

    toResponseDto(options?: O): DTO {
        const dtoClass = this.dtoClass;

        if (!dtoClass) {
            throw new Error(
                `You need to use @UseDto on class (${this.constructor.name}) be able to call toResponseDto function`
            );
        }

        return new dtoClass(this, options);
    }
}
