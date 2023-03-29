import { ApiProperty } from '@nestjs/swagger';

import type { GeographyLocation } from '../../entities';

export class GeographyLocationDto {
    @ApiProperty()
    timezone: string;

    @ApiProperty()
    city: string;

    @ApiProperty()
    region: string;

    @ApiProperty()
    country: string;

    @ApiProperty()
    latitude: string;

    @ApiProperty()
    longitude: string;

    constructor(geographyLocation: GeographyLocation) {
        this.timezone = geographyLocation.timezone;
        this.city = geographyLocation.city;
        this.region = geographyLocation.region;
        this.country = geographyLocation.country;
        this.latitude = geographyLocation.latitude;
        this.longitude = geographyLocation.longitude;
    }
}
