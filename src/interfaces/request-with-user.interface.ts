import type { Request } from 'express';

import type { User } from '../modules/users/entities';
interface IRequestWithUser extends Request {
    user: User;
}

export default IRequestWithUser;
