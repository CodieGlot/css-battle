import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Excel from 'exceljs';
import path from 'path';
import { Repository } from 'typeorm';

import { ResponseDto } from '../../common/dto';
import { generateHash, validateHash } from '../../common/utils';
import { AccountStatus, UserRole } from '../../constants';
import type { CreateUsersDto } from '../auth/dto/request';
import type { ResetPasswordDto, UploadAvatarDto } from './dto/request';
import { User } from './entities';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) {}

    async findUserByIdOrUsername({ id, username }: { id?: string; username?: string }) {
        return id
            ? this.userRepository.findOne({ where: { id } })
            : this.userRepository.findOne({ where: { username } });
    }

    async getAllParticipants() {
        return this.userRepository.find({ where: { role: UserRole.USER } });
    }

    async createUsers(dto: CreateUsersDto) {
        const promiseSavedUsers = dto.userInfos.map(async (user) => {
            const hasSavedUser = await this.findUserByIdOrUsername({ username: user.username });

            if (hasSavedUser) {
                return null;
            }

            const hashPassword = generateHash(user.password);

            const userEntity = this.userRepository.create({
                username: user.username,
                password: hashPassword
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

            const password = Math.random().toString(36).slice(2, 10);

            userInfos.push({ password, status: AccountStatus.CREATED });

            const userEntity = this.userRepository.create({
                username,
                password: generateHash(password)
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

    async uploadAvatar(id: string, dto: UploadAvatarDto) {
        await this.findUserByIdOrUsername({ id });

        await this.userRepository.update(id, dto);

        return new ResponseDto({ message: 'Upload avatar successfully' });
    }

    async resetPassword(id: string, dto: ResetPasswordDto) {
        const user = await this.findUserByIdOrUsername({ id });

        const isPasswordValid = await validateHash(dto.oldPassword, user?.password);

        if (!isPasswordValid) {
            throw new BadRequestException();
        }

        await this.userRepository.update(id, { password: generateHash(dto.newPassword) });

        return new ResponseDto({ message: 'Reset password successfully' });
    }

    async deleteUser(id: string): Promise<ResponseDto> {
        await this.findUserByIdOrUsername({ id });

        await this.userRepository.delete(id);

        return new ResponseDto({ message: 'User deleted successfully' });
    }
}
