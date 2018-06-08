import { Injectable } from '@angular/core';
import {Http} from "@angular/http";

@Injectable()
export class AdminUtilsService {

  constructor(private http: Http) { }

  getExampleVars() {
    return this.http.get('assets/data/jazz-installer-vars.json')
      .toPromise()
      .then(function(response) {
        return response.json();
      });

  }
}
