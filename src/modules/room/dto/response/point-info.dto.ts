export class PointInfoDto {
    point: number;

    time: number;

    constructor(dto: PointInfoDto) {
        this.point = dto.point;
        this.time = dto.time;
    }
}
