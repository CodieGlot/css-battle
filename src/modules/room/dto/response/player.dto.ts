import type { PlayerStatus, UserRole } from '../../../../constants';

export class PlayerDto {
    id: string;

    role: UserRole;

    username: string;

    avatarUrl: string;

    status: PlayerStatus;

    constructor(dto: PlayerDto) {
        this.id = dto.id;
        this.role = dto.role;
        this.username = dto.username;
        this.avatarUrl = dto.avatarUrl;
        this.status = dto.status;
    }
}
