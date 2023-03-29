import { HttpStatus } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseDto {
    @ApiPropertyOptional({ example: HttpStatus.OK })
    readonly status?: number;

    @ApiPropertyOptional({ example: 'OK' })
    readonly message: string;

    constructor(response: ResponseDto) {
        this.message = response.message;
    }
}
