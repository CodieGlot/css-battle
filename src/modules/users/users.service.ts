import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hashPassword } from 'src/utils/bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './templates/CreateUserDto';
import { User } from './templates/UserEntity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async findAllUSers() {
    return await this.usersRepository.find();
  }

  async createUser(createUserDto: CreateUserDto) {
    if (
      (await this.usersRepository.findOneBy({
        username: createUserDto.username,
      })) ||
      (await this.usersRepository.findOneBy({ email: createUserDto.email }))
    )
      return null;

    createUserDto.password = await hashPassword(createUserDto.password);

    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(createUserDto);
  }

  async findUserById(id: string) {
    return await this.usersRepository.findOneBy({ id: id });
  }

  async findUserByUsername(username: string) {
    return await this.usersRepository.findOneBy({ username: username });
  }

  async findUserByEmail(email: string) {
    return await this.usersRepository.findOneBy({ email: email });
  }
}
