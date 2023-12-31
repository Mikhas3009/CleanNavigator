import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { MarkModel } from 'src/repository/mark-repository/mark-model';
import { MarkRepositoryService } from 'src/repository/mark-repository/mark-repository.service';
import * as uuid from 'uuid';

@Injectable()
export class MapService {

    constructor(
        private markReqpositoryService: MarkRepositoryService,
        private firebaseService: FirebaseService
    ){}

    async addMark(body:MarkModel,files:any[]){
        body.isChecked = false;
        let path = [];
        const mark = await this.markReqpositoryService.createMark(body)
            .catch(err=>{
                console.log(err);
                throw new HttpException('Не удалось поставить отметку',HttpStatus.BAD_GATEWAY);
            })
        files.forEach((file)=>{
            file.originalname = uuid.v4()+'.png';
            path.push(file.originalname);
        })
        mark.pictures = path;
        const [res1 ,res2 ] = await Promise.all([
            this.firebaseService.uploadFilesToUserFolder(String(mark.id),files,''),
            this.markReqpositoryService.updateMark(mark)
        ]).catch((err)=>{
            throw err;
        })
        return {
            message:'Success'
        }
    }

    async updateMark(body:MarkModel,files){
        let path = [];
        files.forEach((file)=>{
            path.push(file.originalname);
        })
        path = path.splice(0,path.length-1)
        body.pictures = path;
        const [res1 ,res2 ] = await Promise.all([
            this.firebaseService.uploadFilesToUserFolder(String(body.id),files),
            this.markReqpositoryService.updateMark(body)
        ]).catch((err)=>{
            throw err;
        })
    }

    async addMarks(body){
        await this.markReqpositoryService.createManyMarks(body);
    }

    async getMarkById(id:number){
        const mark = await this.markReqpositoryService.getMarkById(id)
            .catch((err)=>{
                console.log(err);
                throw err;
            });
        const pictures = [...mark.pictures];
        mark.pictures = [];
        await Promise.all(pictures.map(async (picture) => {
            const url = await this.firebaseService.getPhotoUrl(String(mark.id), picture);
            mark.pictures.push(picture);
        }));
        return mark;
        
    }

    async getUnConfirmedMarks(){
        const marks =  await this.markReqpositoryService.getNotAcceptedMarks();
        await Promise.all(marks.map(async (mark) => {
            const pictures = [...mark.pictures];
            console.log(pictures)
            mark.pictures = [];
            console.log(pictures);
            await Promise.all(pictures.map(async (picture) => {
                const url = await this.firebaseService.getPhotoUrl(String(mark.id), picture.replace(' ',''));
                mark.pictures.push(url);
            }));
        }));
        return marks;
    }

    async confirmMark(mark){
        const{id}=mark
        await this.markReqpositoryService.confirmMark(id)
            .catch((err)=>{
                console.log(err);
                throw err;
            });
    }

    async getAllMarks(){
        const marks = await this.markReqpositoryService.getAllMarks();
        await Promise.all(marks.map(async (mark) => {
            const pictures = [...mark.pictures]
            mark.pictures = [];
    
            await Promise.all(pictures.map(async (picture) => {
                const url = await this.firebaseService.getPhotoUrl(String(mark.id), picture);
                mark.pictures.push(url);
            }));
        }));
        return marks;
    }

    async getClosestMarks(coordinates){
        const { longitude,latitude} = coordinates;
        let marks = await this.markReqpositoryService.getClosestMarks(latitude,longitude)
            .catch(err=>{
                console.log(err);
                throw new HttpException('Не удалось получить список корриднат',HttpStatus.BAD_GATEWAY);
            });
            await Promise.all(marks.map(async (mark) => {
                const pictures = [...mark.pictures];
                console.log(pictures);
                mark.pictures = [];
        
                await Promise.all(pictures.map(async (picture) => {
                    const url = await this.firebaseService.getPhotoUrl(String(mark.id), picture);
                    mark.pictures.push(url);
                }));
            }));
        return marks
    }

    async deleteMark(mark){
        const{id} = mark;
        await this.markReqpositoryService.deleteMark(id)
            .catch((err)=>{
                console.log(err)
                throw new HttpException('Не удалось удалить новость',HttpStatus.BAD_GATEWAY);
            })
        return {
            message:'Success'
        }
    }
}
