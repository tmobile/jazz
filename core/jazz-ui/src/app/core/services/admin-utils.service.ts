import { Injectable } from '@angular/core';
import {Http} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {RequestService} from "./request.service";

@Injectable()
export class AdminUtilsService {
  private http;

  constructor(private request: RequestService) {
    this.http = this.request;
  }

  getJazzInstallerVars() {
    return this.http.get('/jazz/admin/config')
      .toPromise()
      .then((response) => {
          if(response && response.data && response.data.config)
          return response.data.config;
      })
  }
}
