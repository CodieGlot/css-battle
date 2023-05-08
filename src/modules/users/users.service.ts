import { faker } from '@faker-js/faker';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Excel from 'exceljs';
import { verify } from 'jsonwebtoken';
import path from 'path';
import type { Socket } from 'socket.io';
import { Repository } from 'typeorm';

import { ResponseDto } from '../../common/dto';
import { generateHash } from '../../common/utils';
import { AccountStatus, defaultPassword, PlayerStatus, UserRole } from '../../constants';
import type ITokenPayload from '../../interfaces/token-payload.interface';
import { ApiConfigService } from '../../shared/services/api-config.service';
import { PlayerDto } from '../room/dto/response';
import type { CreateUsersDto, ResetPasswordDto, UserInfoDto } from './dto/request';
import { User } from './entities';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ApiConfigService
    ) {}

    async getUserFromSocket(socket: Socket) {
        let token = socket.handshake.headers.authorization;
        token = token?.split(' ')[1];

        const payload = verify(token as string, this.configService.authConfig.publicKey) as ITokenPayload;

        const user = await this.findUserByIdOrUsername({ id: payload.userId });

        if (!user) {
            socket.emit('error', 'User Not Found');

            throw new UnauthorizedException('User Not Found');
        }

        return new PlayerDto({ ...user, status: PlayerStatus.WAITING, points: [], total: 0 });
    }

    async findUserByIdOrUsername({ id, username }: { id?: string; username?: string }) {
        return id
            ? this.userRepository.findOne({ where: { id } })
            : this.userRepository.findOne({ where: { username } });
    }

    async getAllParticipants() {
        return this.userRepository.find({ where: { role: UserRole.USER } });
    }

    async createUser(dto: UserInfoDto) {
        const user = await this.findUserByIdOrUsername({ username: dto.username });

        if (user) {
            throw new ConflictException('User already exists');
        }

        const userEntity = this.userRepository.create({
            username: dto.username,
            password: generateHash(dto.password),
            avatarUrl: faker.image.avatar()
        });

        return this.userRepository.save(userEntity);
    }

    async createUsers(dto: CreateUsersDto) {
        const promiseSavedUsers = dto.userInfos.map(async (user) => {
            const hasSavedUser = await this.findUserByIdOrUsername({ username: user.username });

            if (hasSavedUser) {
                return null;
            }

            const userEntity = this.userRepository.create({
                username: user.username,
                password: generateHash(user.password),
                avatarUrl: faker.image.avatar()
            });

            return this.userRepository.save(userEntity);
        });

        return Promise.all(promiseSavedUsers);
    }

    async createUsersFromSheet() {
        const workbook = new Excel.Workbook();
        const filePath = path.resolve(__dirname, 'users.xlsx');

        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet('Sheet1');
        let rowStartIndex = 2;
        const numberOfRows = worksheet.rowCount - 1;

        const rows = worksheet.getRows(rowStartIndex, numberOfRows) ?? [];

        const userInfos: Array<{ password?: string; status?: AccountStatus }> = [];

        const promiseSavedUsers = rows.map(async (row) => {
            if (this.getCellValue(row, 4)) {
                userInfos.push({});

                return null;
            }

            const username = this.getCellValue(row, 2);

            const hasSavedUser = await this.findUserByIdOrUsername({ username });

            if (hasSavedUser) {
                userInfos.push({ status: AccountStatus.CONFLICT });

                return null;
            }

            const password = defaultPassword;

            userInfos.push({ password, status: AccountStatus.CREATED });

            const userEntity = this.userRepository.create({
                username,
                password: generateHash(password),
                avatarUrl: faker.image.avatar()
            });

            return this.userRepository.save(userEntity);
        });

        await Promise.all(promiseSavedUsers);

        for (const user of userInfos) {
            const row = worksheet.getRow(rowStartIndex);

            if (user.password) {
                row.getCell(3).value = user.password;
            }

            if (user.status) {
                row.getCell(4).value = user.status;
            }

            row.commit();
            rowStartIndex++;
        }

        await workbook.xlsx.writeFile(filePath);

        return new ResponseDto({ message: 'Create users successfully' });
    }

    getCellValue(row: Excel.Row, cellIndex: number) {
        const cell = row.getCell(cellIndex);

        return cell.value ? cell.value.toString() : undefined;
    }

    async resetPassByAdmin(id: string) {
        await this.findUserByIdOrUsername({ id });

        await this.userRepository.update(id, { password: generateHash(defaultPassword) });

        return new ResponseDto({ message: 'Reset password successfully' });
    }

    async changePassword(id: string, dto: ResetPasswordDto) {
        if (dto.firstPassword !== dto.secondPassword) {
            throw new BadRequestException('Password not match');
        }

        await this.userRepository.update(id, { password: generateHash(dto.firstPassword) });

        return new ResponseDto({ message: 'Reset password successfully' });
    }

    async deleteUser(id: string): Promise<ResponseDto> {
        await this.findUserByIdOrUsername({ id });

        await this.userRepository.delete(id);

        return new ResponseDto({ message: 'User deleted successfully' });
    }
}
