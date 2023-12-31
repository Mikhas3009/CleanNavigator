import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { FirebaseAdmin } from 'nestjs-firebase';
import { FirebaseService } from 'src/firebase/firebase.service';
import { UserDto } from './user-dto';
import * as uuid from 'uuid';
import { EmailService } from 'src/email/email.service';
import { UserRepositoryService } from 'src/repository/user-repository/user-repository.service';
import {  PhoneNumberUtil } from 'google-libphonenumber';
import { JWTService } from 'src/jwt/jwt.service';
import { UserRoles } from 'src/roles-guards/roles';
import * as nanoid from 'nanoid';
var randomize = require('randomatic');

@Injectable()
export class AuthService {

    constructor(
        private readonly firebaseService: FirebaseService,
        private readonly emailService:EmailService,
        private readonly userRepository:UserRepositoryService,
        private readonly jwtService: JWTService
    ){}

    async authUser(body:UserDto){
        const {phone,password} = body;
        const user = await this.userRepository.findByNumber(phone)
        if (!user||password != user.password){
            throw new UnauthorizedException('Неверные данные')
        }
        return this.jwtService.generateAccessToken(user);
    } 

    async restorePassword(phone?:string){ 
        const code = uuid.v4().slice(0,6);
        // console.log(number)
        // const {email} = await this.userRepository.findByNumber(number);
        const user = await this.userRepository.setEmailCode(phone,code)
            .catch(err=>console.log(err));
        if(!user){
            throw new UnauthorizedException('Аккаунта не существует')
        }
        return await this.emailService.sendMail(user,user.email)
            .catch(err=>{throw err});
    }

    async confirmEmailCode(body){
        const {email, code} = body;
        const user = await this.userRepository.findByEmail(email)
            .catch(err=>{
                throw new HttpException("Ошибка сервера",HttpStatus.BAD_GATEWAY)
            });
        if(code != user.emailCode){
            throw new UnauthorizedException('Неверный код!');
        }
        await this.userRepository.setEmailCode(user.email,null)
    }

    async checkNumber(body){
        const {number} = body;
        //PhoneNumberUtil.getInstance()
        const user = await this.userRepository.findByNumber(number)
            .catch(err=>{
                console.log(err);
            });
        if(user){
            return false;
        }
        else return true;
    }

    async checkEmail(body){
        const {email} = body;
        //PhoneNumberUtil.getInstance()
        const user = await this.userRepository.findByEmail(email)
            .catch(err=>{
                console.log(err);
            });
        if(user){
            return false;
        }
        else return true;
    }

    async vefifyNumber(req,token:string){
        console.log(token)
        const numericCode = String(Math.floor(Math.random() * (9999 - 1000 + 1) + 1000));
        await this.firebaseService.sendNotification(token, numericCode)
            .catch((err)=>{
                console.log(err);
                throw err;
            });
        return {code:numericCode};
    }

    async getImage(){
        return await this.firebaseService.getPhotoUrl();
    }
    
    async registration(body,role = UserRoles.User){
        body.role = role;
        const user = await this.userRepository.createUser(body)
            .catch(err=>{
                throw new HttpException("Критическая ошибка сервера",HttpStatus.BAD_GATEWAY)
            })
        return await this.jwtService.generateAccessToken(user);
    }

    async isLoggedIn(token){
       const res =  await this.jwtService.veifyToken(token)
        .catch((err)=>{
            console.log(err);
            throw new UnauthorizedException('Пользователь не авторизован');
        })
        return this.jwtService.generateAccessToken(res);
    }
}
