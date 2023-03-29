import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString } from 'class-validator';

export class CreateGeographyDto {
    @IsString()
    @ApiProperty()
    timezone: string;

    @IsString()
    @ApiProperty()
    city: string;

    @IsString()
    @ApiProperty()
    region: string;

    @IsString()
    @ApiProperty()
    country: string;

    @IsNumberString()
    @ApiProperty()
    latitude: string;

    @IsNumberString()
    @ApiProperty()
    longitude: string;

    @IsString()
    @ApiProperty()
    userId: string;
}
