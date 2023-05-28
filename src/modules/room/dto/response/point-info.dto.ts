export class PointInfoDto {
    questionId: string;

    point: number;

    time: number;

    constructor(dto: PointInfoDto) {
        this.questionId = dto.questionId;
        this.point = dto.point;
        this.time = dto.time;
    }
}
