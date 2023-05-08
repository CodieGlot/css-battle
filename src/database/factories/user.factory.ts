import { setSeederFactory } from 'typeorm-extension';
import { RegisterMethod, UserRole } from '../../constants';
import { User } from '../../modules/users/entities';

export default setSeederFactory(User, (faker) => {
    const user = new User();

    const firstName = faker.name.firstName('male').toLowerCase();
    const lastName = faker.name.lastName('male').toLowerCase();
    user.role = UserRole.USER;
    user.password = '25251325';
    user.createdAt = faker.date.between('2021-01-01', '2022-12-31');

    return user;
});
