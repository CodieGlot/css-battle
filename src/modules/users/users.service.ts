import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import geoip from 'geoip-lite';
import type { FindOptionsWhere } from 'typeorm';
import { Repository } from 'typeorm';

import { ResponseDto } from '../../common/dto';
import type { PageDto } from '../../common/dto/page.dto';
import { generateHash } from '../../common/utils';
import { RegisterMethod, UserRole } from '../../constants';
import type { IGeographyLite } from '../../interfaces/geography-lite.interface';
import type { UserRegisterDto } from '../auth/dto/request/user-register.dto';
import type {
    ChangePasswordDto,
    CreateGeographyDto,
    CreateSubscriptionDto,
    GetFilterUserDto,
    ResetPasswordDto
} from './dto';
import type { UserDto } from './dto/response/user.dto';
import type { UsersPageOptionsDto } from './dto/response/users-page-options.dto';
import { GeographyLocation, SubscriptionTransaction, User } from './entities';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        @InjectRepository(SubscriptionTransaction)
        private readonly subscriptionTransactionRepository: Repository<SubscriptionTransaction>,

        @InjectRepository(GeographyLocation)
        private readonly geographyLocationRepository: Repository<GeographyLocation>
    ) {}

    /**
     * Find single user
     */
    findOne(findData: FindOptionsWhere<User>): Promise<User | null> {
        return this.userRepository.findOneBy(findData);
    }

    async getUserById(userId: string): Promise<User> {
        return this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.geography', 'geography')
            .andWhere('user.id = :userId', { userId })
            .getOneOrFail();
    }

    async getUserByEmail(email: string) {
        return this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.geography', 'geography')
            .andWhere('user.email = :email', { email })
            .getOne();
    }

    async findByIdOrEmail(
        options: Partial<{ userId: string; email: string; registerType: RegisterMethod }>
    ): Promise<User> {
        const queryBuilder = this.userRepository.createQueryBuilder('user');

        if (options.email) {
            queryBuilder.where('user.email = :email', {
                email: options.email
            });
        }

        if (options.userId) {
            queryBuilder.where('user.id = :id', {
                id: options.userId
            });
        }

        if (options.registerType) {
            queryBuilder.andWhere('user.registerType = :registerType', {
                registerType: options.registerType
            });
        }

        const result = await queryBuilder.getOne();

        if (!result) {
            throw new NotFoundException();
        }

        return result;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: {
                email
            },
            relations: ['geography']
        });
    }

    async createUser(
        dto: UserRegisterDto,
        registerType: RegisterMethod,
        ipAddress: string
    ): Promise<UserDto> {
        const user = await this.handleCreateUserAccount(dto, registerType);

        await this.collectGeographyLocation(ipAddress, user.id);

        return user.toResponseDto({ isShowGeography: false });
    }

    private async handleCreateUserAccount(dto: UserRegisterDto, registerType: RegisterMethod): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {
                email: dto.email,
                registerType: RegisterMethod.REGISTER
            },
            withDeleted: true
        });

        if (user) {
            throw new ConflictException();
        }

        const userEntity = this.userRepository.create(dto);
        userEntity.registerType = registerType;

        return this.userRepository.save(userEntity);
    }

    private async collectGeographyLocation(ipAddress: string, userId: string): Promise<GeographyLocation> {
        const location = JSON.stringify(geoip.lookup(ipAddress));
        const geographyLite: IGeographyLite = JSON.parse(location);

        const geographyDto: CreateGeographyDto = {
            timezone: geographyLite.timezone,
            city: geographyLite.city,
            region: geographyLite.region,
            country: geographyLite.country,
            latitude: geographyLite.ll[0],
            longitude: geographyLite.ll[1],
            userId
        };

        const geography = this.geographyLocationRepository.create(geographyDto);

        return this.geographyLocationRepository.save(geography);
    }

    async getUsers(dto: UsersPageOptionsDto): Promise<PageDto<UserDto>> {
        const queryBuilder = this.userRepository.createQueryBuilder('user');
        const [items, pageMetaDto] = await queryBuilder.paginate(dto);

        return items.toPageResponseDto(pageMetaDto);
    }

    async deleteUser(userId: string): Promise<ResponseDto> {
        await this.userRepository.softDelete(userId);

        return new ResponseDto({ message: 'User deleted successfully!' });
    }

    async deleteUserByAdmin(userId: string): Promise<ResponseDto> {
        await this.findByIdOrEmail({ userId });

        await this.userRepository.delete(userId);

        return new ResponseDto({ message: 'User deleted successfully!' });
    }

    async subscription(subscriptionDto: CreateSubscriptionDto, userId: string) {
        const user = await this.userRepository.findOneByOrFail({ id: userId });

        user.isSubscription = true;

        const subscription = this.subscriptionTransactionRepository.create({
            ...subscriptionDto,
            user
        });

        await this.subscriptionTransactionRepository.save(subscription);
        await this.userRepository.save(user);

        return new ResponseDto({ message: `Subscription successfully!` });
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        const user = await this.findByIdOrEmail({ userId });

        if (user.registerType !== RegisterMethod.REGISTER) {
            throw new NotFoundException();
        }

        if (changePasswordDto.newPassword === changePasswordDto.newPasswordConfirmed) {
            await this.updatePassword(user.id, changePasswordDto.newPassword);

            return new ResponseDto({ message: `Password updated successfully!` });
        }

        throw new BadRequestException();
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResponseDto> {
        const user = await this.findByIdOrEmail({
            email: resetPasswordDto.email
        });

        if (user.registerType !== RegisterMethod.REGISTER) {
            throw new NotFoundException();
        }

        await this.updatePassword(user.id, resetPasswordDto.newPassword);

        return new ResponseDto({ message: `Password updated successfully!` });
    }

    async updatePassword(id: string, password: string) {
        return this.userRepository.update(id, {
            password: generateHash(password)
        });
    }

    updateLastLogin(id: string) {
        return this.userRepository.update(id, {
            lastLogin: new Date()
        });
    }

    async filterUsers(dto: GetFilterUserDto): Promise<PageDto<UserDto>> {
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .where('user.role = :role', { role: UserRole.USER });

        if (dto.searchKey) {
            queryBuilder.andWhere('user.email ILIKE :searchKey', { searchKey: `%${dto.searchKey}%` });
        }

        if (dto.startDate) {
            queryBuilder.andWhere('(user.createdAt)::date >= :startDate', { startDate: dto.startDate });
        }

        if (dto.endDate) {
            queryBuilder.andWhere('(user.createdAt)::date <= :endDate', { endDate: dto.endDate });
        }

        if (dto.startDate && dto.endDate) {
            queryBuilder.andWhere('(user.createdAt)::date BETWEEN :startDate AND :endDate', {
                startDate: dto.startDate,
                endDate: dto.endDate
            });
        }

        if (dto.createdAt) {
            queryBuilder.orderBy('user.createdAt', dto.createdAt);
        }

        const [items, pageMetaDto] = await queryBuilder.paginate(dto);

        return items.toPageResponseDto(pageMetaDto, { isShowGeography: true });
    }

    async checkExistingEmail(email: string) {
        const result = await this.userRepository.findOne({ where: { email }, withDeleted: true });

        if (result) {
            throw new ConflictException();
        }

        return new ResponseDto({ message: 'Email valid' });
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async unsubscribe() {
        const usersExpiredSubscription = await this.subscriptionTransactionRepository
            .createQueryBuilder('subscription')
            .where({ status: true })
            .andWhere('subscription.exp_date < :currentDate', { currentDate: new Date() })
            .getMany();

        await this.subscriptionTransactionRepository
            .createQueryBuilder()
            .update(SubscriptionTransaction)
            .set({ status: false })
            .where({ status: true })
            .andWhere('subscription_transaction.exp_date < :currentDate', { currentDate: new Date() })
            .execute();

        if (usersExpiredSubscription.length > 0) {
            await this.userRepository
                .createQueryBuilder()
                .update(User)
                .set({ isSubscription: false })
                .where('id IN (:...ids)', { ids: usersExpiredSubscription.map((item) => item.id) })
                .execute();
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async deleteUsers() {
        await this.userRepository
            .createQueryBuilder()
            .delete()
            .where(`((deleted_at)::date + INTERVAL '30 DAYS')::date < NOW()::date`)
            .execute();
    }
}
