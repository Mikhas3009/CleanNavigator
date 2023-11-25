import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { MarkModel } from 'src/repository/mark-repository/mark-model';
import { MarkRepositoryService } from 'src/repository/mark-repository/mark-repository.service';

@Injectable()
export class MapService {

    constructor(
        private markReqpositoryService: MarkRepositoryService,
        private firebaseService: FirebaseService
    ){}

    async addMark(body:MarkModel,files:any[]){
        body.isChecked = false;
        let path = '';
        const mark = await this.markReqpositoryService.createMark(body)
            .catch(err=>{
                console.log(err);
                throw new HttpException('Не удалось поставить отметку',HttpStatus.BAD_GATEWAY);
            })
        files.forEach((file)=>{
            path = path+file.originalname+" "
        })
        path = path.slice(0,path.length-1)
        mark.pictures = path;

        const [res1 ,res2 ] = await Promise.all([
            this.firebaseService.uploadFilesToUserFolder(String(mark.id),files),
            this.markReqpositoryService.updateMark(mark)
        ]).catch((err)=>{
            throw err;
        })
        return {
            message:'Success'
        }
    }

    async addMarks(body){
        await this.markReqpositoryService.createManyMarks(body);
    }

    async getUnConfirmedMarks(){
        return await this.markReqpositoryService.getNotAcceptedMarks();
    }

    async getMarks(coordinates){
        const { longitude,latitude} = coordinates;
        let marks = await this.markReqpositoryService.getClosestMarks(latitude,longitude)
            .catch(err=>{
                console.log(err);
                throw new HttpException('Не удалось получить список корриднат',HttpStatus.BAD_GATEWAY);
            });
            await Promise.all(marks.map(async (mark) => {
                const pictures = mark.pictures.split(' ');
                mark.pictures = '';
        
                await Promise.all(pictures.map(async (picture) => {
                    const url = await this.firebaseService.getPhotoUrl(String(mark.id), picture);
                    mark.pictures = mark.pictures + url+" ";
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
