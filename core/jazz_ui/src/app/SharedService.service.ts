import { Injectable } from '@angular/core';
import {IShared} from "./IShared";

@Injectable()
export class SharedService {


    sharedMessage: IShared = {
        body: 'old body',
        type: 'old type',
    };

    setMessage(body, type) {
        this.sharedMessage.body = body;
        this.sharedMessage.type = type;
    }

    constructor() { }
}