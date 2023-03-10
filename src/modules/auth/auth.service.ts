import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { isEmail } from 'class-validator';
import { comparePassword } from 'src/utils/bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  //username parameter could be passed as an email
  async validateUser(username: string, pass: string) {
    const user = isEmail(username)
      ? await this.usersService.findUserByEmail(username)
      : await this.usersService.findUserByUsername(username);

    if (!user) return null;

    const { id, password, ...remaining } = user;
    const isAuthenticated = (await comparePassword(pass, password))
      ? true
      : false;

    return { ...remaining, isAuthenticated };
  }
}
