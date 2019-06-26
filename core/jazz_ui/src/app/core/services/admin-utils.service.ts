import {Injectable} from '@angular/core';
import {Http} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {RequestService} from "./request.service";

@Injectable()
export class AdminUtilsService {
  private http;
  constructor(private request: RequestService) {
    this.http = this.request;
  }

  getJazzConfig() {
    return this.http.get('/jazz/admin/config')
      .toPromise()
      .then((response) => {
        if (response && response.data && response.data.config)
          return response.data.config;
      })
  }
  getAdminUsers(pageToken) {
    let pageLimit = 10;
    return this.http.get(`/jazz/usermanagement`)
      .toPromise()
      .then((response) => {
        if (response && response.data && response.data.users)
          return response.data;
      })
  }
}
