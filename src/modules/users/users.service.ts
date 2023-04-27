import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ResponseDto } from '../../common/dto';
import { generateHash } from '../../common/utils';
import { UserRole } from '../../constants';
import type { CreateUsersDto } from '../auth/dto/request';
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

    async deleteUser(username: string): Promise<ResponseDto> {
        await this.findUserByIdOrUsername({ username });

        await this.userRepository.delete(username);

        return new ResponseDto({ message: 'User deleted successfully!' });
    }
}
