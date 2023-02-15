import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersService } from './modules/users/users.service';

@Module({
  imports: [AuthModule, UsersService],
  controllers: [],
  providers: [],
})
export class AppModule {}
