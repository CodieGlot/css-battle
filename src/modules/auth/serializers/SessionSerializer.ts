import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from 'src/modules/users/users.service';
import { User } from 'src/modules/users/templates/UserEntity';

export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: (err, user: User) => void) {
    done(null, user);
  }

  async deserializeUser(payload: User, done: (err, user: User) => void) {
    const user = await this.usersService.findUserById(payload.id);
    return user ? done(null, user) : done(null, null);
  }
}
