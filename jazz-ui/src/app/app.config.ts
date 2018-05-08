import { Inject, Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { environment } from '../environments/environment';


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

 
  getConfiguration():Configuration {

    return this.config;
  }
}


// loader function - we use this function out of the ConfigService, for AOT reasons
export function ConfigLoader(configService: ConfigService) {

  //Note: this factory need to return a function (that return a promise)
  return () => environment.baseurl;
}
