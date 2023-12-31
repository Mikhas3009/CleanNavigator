import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from "@nestjs/sequelize";
import * as path from 'path';
import { SitizensReqModel } from 'src/repository/citizens-request-repository/citizens-request-model';
import { MarkModel } from 'src/repository/mark-repository/mark-model';
import { UserModel } from 'src/repository/user-repository/user-model';


@Module({//Модуль базы данных
    imports:[
        ConfigModule.forRoot({
            envFilePath: './.db.env',
            ignoreEnvFile: true,
            isGlobal:false
        }),
        SequelizeModule.forRoot({
            dialect : "postgres",
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME, 
            synchronize: true,
            autoLoadModels: true,
            models:[
                UserModel,
                MarkModel,
                SitizensReqModel
            ],
        }),
    ],
})
export class DBModule {}