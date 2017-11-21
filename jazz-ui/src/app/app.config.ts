import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';


// Configuration model - should adhere to the config.json file
// link to config.json is provided in the environments/environment.*.ts files
export interface Configuration {
  baseurl: string
}


// Service that loads the configuration file.
@Injectable()
export class ConfigService {
  private config: Configuration;

  constructor(private http:Http) {}
  
  load(url:string) { 
    return new Promise((resolve, reject) => {
        this.http.get(url).map( res => res.json() ).catch((error: any):any => {
          console.log('Configuration file could not be read');
          resolve(true);
          return Observable.throw(error.json().error || 'Server error');
        }).subscribe( (envResponse) => {
          this.config = envResponse;
          resolve(true);
        });
      });
  }

  getConfiguration():Configuration {

    return this.config;
  }
}

// import environment variables
import { environment } from '../environments/environment';

// loader function - we use this function out of the ConfigService, for AOT reasons
export function ConfigLoader(configService: ConfigService) {

  //Note: this factory need to return a function (that return a promise)
  return () => configService.load(environment.configFile); 
}
