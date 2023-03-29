import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { RegisterMethod, UserRole } from '../../constants';
import { User } from '../../modules/users/entities';

export class UserSeeder implements Seeder {
    public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<any> {
        const repository = dataSource.getRepository(User);
        await repository.save([
            {
                id: 'a77fbaeb-10d0-469f-93db-7df29b655fbc',
                role: UserRole.ADMIN,
                email: 'admin@nestjs.com',
                password: 'nestjs@123',
                registerType: RegisterMethod.REGISTER,
                isSubscription: false
            },
            {
                id: 'b715dfdf-8919-4c46-9e14-2b3be062b3d9',
                role: UserRole.ADMIN,
                email: 'devops@nestjs.com',
                password: 'nestjs@123',
                registerType: RegisterMethod.REGISTER,
                isSubscription: false
            },
            {
                id: 'dda314a4-ccaf-4130-a468-e16e9ecc75e5',
                role: UserRole.USER,
                email: 'dev@nestjs.com',
                password: 'nestjs@123',
                registerType: RegisterMethod.REGISTER,
                isSubscription: false
            },
            {
                id: '2de294b6-59ee-4809-8b60-d8678d73f3db',
                role: UserRole.USER,
                email: 'qa@nestjs.com',
                password: 'nestjs@123',
                registerType: RegisterMethod.REGISTER,
                isSubscription: false
            }
        ]);

        // ---------------------------------------------------

        // const userFactory = factoryManager.get(User);
        // save 1 factory generated entity, to the database
        // await userFactory.save();

        // save 5 factory generated entities, to the database
        // const subscriptions = factoryManager.get(SubscriptionTransaction);
        // const users = await userFactory.saveMany(5000);
        // users.forEach(async (user) => {
        //     await subscriptions.save({
        //         user
        //     });
        // });
    }
}
