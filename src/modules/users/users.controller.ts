import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SerializedUser } from 'src/modules/users/templates/SerializedUser';
import { UsersService } from './users.service';
import { CreateUserDto } from './templates/CreateUserDto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('')
  async findAllUsers() {
    return (await this.usersService.findAllUSers()).map(
      (user) => new SerializedUser(user),
    );
  }

  @UsePipes(ValidationPipe)
  @Post('signup')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);

    if (!user)
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);

    return `User ${user.username} has been created`;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('/:username')
  async findUserByUsername(@Param('username') username: string) {
    const user = await this.usersService.findUserByUsername(username);

    if (!user)
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    return new SerializedUser(user);
  }
}
