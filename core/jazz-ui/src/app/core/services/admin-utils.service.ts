import { Injectable } from '@angular/core';
import {Http} from "@angular/http";
import {Observable} from "rxjs/Observable";

@Injectable()
export class AdminUtilsService {

  constructor(private http: Http) { }

  getExampleVars() {
    return Observable.of({
      'data': [{
        'first': 'first',
        'second': 'hi'
      }]
    })
    // return this.http.get('assets/data/jazz-installer-vars.json')
      .toPromise()
      // .then(response => response.json());
  }
}
