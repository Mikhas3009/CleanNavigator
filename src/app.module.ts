import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { FirebaseIntegrationModule } from './firebase/firebase.module';
import { DBModule } from './DB/DB-module';
import { UserRepositoryModule } from './repository/user-repository/user-repository.module';
import { EmailModule } from './email/email.module';
import { MyJwtModule } from './jwt/jwt.module';
import { MarkRepositoryModule } from './repository/mark-repository/mark-repository.module';
import { MapModule } from './map/map.module';
import { PersonalCabinetModule } from './personal-cabinet/personal-cabinet.module';

@Module({
    imports: [
        AuthModule, 
        FirebaseIntegrationModule,
        DBModule,
        UserRepositoryModule,
        EmailModule,
        MyJwtModule,
        MarkRepositoryModule,
        MapModule,
        PersonalCabinetModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
