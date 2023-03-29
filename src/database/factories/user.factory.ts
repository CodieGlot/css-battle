import { setSeederFactory } from 'typeorm-extension';
import { RegisterMethod, UserRole } from '../../constants';
import { User } from '../../modules/users/entities';

export default setSeederFactory(User, (faker) => {
    const user = new User();

    const firstName = faker.name.firstName('male').toLowerCase();
    const lastName = faker.name.lastName('male').toLowerCase();
    user.role = UserRole.USER;
    user.email = faker.internet.email(firstName, lastName, Math.random().toString(36).substring(2, 15));
    user.password = '25251325';
    user.registerType = RegisterMethod.REGISTER;
    user.isSubscription = Math.random() < 0.5;
    user.createdAt = faker.date.between('2021-01-01', '2022-12-31');

    return user;
});
