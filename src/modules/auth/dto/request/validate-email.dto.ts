import { PickType } from '@nestjs/swagger';

import { UserRegisterDto } from './user-register.dto';

export class ValidateEmailDto extends PickType(UserRegisterDto, ['email'] as const) {}
