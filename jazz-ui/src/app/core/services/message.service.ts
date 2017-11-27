import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { toastMessage } from '../../../config/toastmessages';

@Injectable()
export class MessageService {
    public token: string;
    private toastmsg = toastMessage;
    constructor() {}
    
    successMessage(res, type){
        var message="";
        if(res !== ""){
            if(res ==="true"){
                message=this.toastmsg[type].success;
                return message;
            } else if(res ==="false"){
                message=this.toastmsg[type].fail;
                return message;
            } else if(res.data !==""){
                message=this.toastmsg[type].success;
                return message;
            } else{
                message=this.toastmsg[type].dataNull;
                return message;
            }
        }
    }
    errorMessage(res,type){
        var message="";
        switch(res.status){
            case 0:
                message=this.toastmsg.error0;
                if (type != undefined && this.toastmsg[type].error0 != undefined) {
                    message = this.toastmsg[type].error0
                }
                return message;
            case 400:
                message=this.toastmsg[type].error400;
                return message;
            case 401:
                message=this.toastmsg.error401;
                return message;
            case 403:
                message=this.toastmsg.error403;
                return message;
            case 404:
                message=this.toastmsg[type].error404;
                return message;
            case 500:
                message=this.toastmsg[type].error500;
                return message;
            default:
                message=this.toastmsg.errorDefault;
                return message;
        }
    }
    customMessage(res, type){
        var message = this.toastmsg[type][res];
        return message;
    }
    sessionEnd(res){
        var message="";
        if(res){
            message=this.toastmsg.sessionExp;
            return message;
        }
    }
}

