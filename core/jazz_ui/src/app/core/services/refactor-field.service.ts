
import {Injectable} from '@angular/core';
import {MAPPING} from '../constants/field-name-mapping';

@Injectable()
export class RefactorFieldService {
    constructor() {}

    getMappingObject() {
        return MAPPING;
    }

    getDisplayNameOfKey(key) {
        return MAPPING[key];
    }
}
