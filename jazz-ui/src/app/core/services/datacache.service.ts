/** 
  * @type Service 
  * @desc Data Caching Service - Shared service for storing and retriving data. 
  				As of now data is stored locally. It can be replaced by a more persistent storage.
  * @author Sunil Fernandes
*/


import { Injectable } from '@angular/core';


@Injectable()
export class DataCacheService {
    private store: any = {};

    constructor() {
    }

    // Add an entry to the store
    public set(key:string, value:any){
    	if (key === undefined || key === null || key === "") {
    		return;
    	}

    	// save the value locally
    	this.store[key] = value;
    }

    // Get an entry from the store
    public get(key:string){

    	// get the value
    	if (key === undefined || key === null || key === "") {
    		return null;
    	}

    	return this.store[key];
    }

    // Delete an entry from the store
    public clear(key: string){

    	// clear an entry
    	if (key === undefined || key === null || key === "") {
    		return;
    	}

    	this.store[key] = undefined;
    }

    // Clear store
    public clearAll(){

    	// clear all cache
    	this.store = {};
    }
}