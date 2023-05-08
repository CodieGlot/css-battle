import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { QuestionsModule } from '../questions/questions.module';
import { UsersModule } from '../users/users.module';
import { Room } from './entities';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';

@Module({
    imports: [TypeOrmModule.forFeature([Room]), UsersModule, QuestionsModule],
    providers: [RoomGateway, RoomService]
})
export class RoomModule {}
