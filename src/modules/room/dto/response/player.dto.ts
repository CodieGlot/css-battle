import type { PlayerStatus, UserRole } from '../../../../constants';
import type { PointInfoDto } from './point-info.dto';

export class PlayerDto {
    id: string;

    role: UserRole;

    username: string;

    avatarUrl: string;

    status: PlayerStatus;

    points: PointInfoDto[];

    total: number;

    constructor(dto: PlayerDto) {
        this.id = dto.id;
        this.role = dto.role;
        this.username = dto.username;
        this.avatarUrl = dto.avatarUrl;
        this.status = dto.status;
        this.points = dto.points;
        this.total = dto.total;
    }
}
