/** 
  * @type Service 
  * @desc Authentication Service - for login, logout, auth related services.
  * @author Sunil Fernandes
*/

import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { ConfigService } from '../../app.config';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';


@Injectable()
export class AuthenticationService {
    public token: string;
    private baseurl: string;
    private userid: string;

    constructor(private http: Http, private configService: ConfigService, private router:Router) {
        // set token if saved in local storage
        let currentUser;
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.token = currentUser && currentUser.token;

        this.baseurl = localStorage.getItem('overridehost')? localStorage.getItem('overridehost') :  environment.baseurl;
    }
    getToken(){
        let currentUser;
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.token = currentUser && currentUser.token;
        return this.token;
    }

    login(username: string, password: string): Observable<boolean> {
        let headers = new Headers({ 'Content-Type': 'application/json', 'accept':'application/json' });
        let options = new RequestOptions({ headers: headers });
        return this.http.post(this.baseurl + '/jazz/login', JSON.stringify({ username: username, password: password }), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let token;
                let response_data = response.json() && response.json().data;

                if (response_data) {
                    token = response_data.token;
                    // set token property
                    this.token = token;
                    // store username and jwt token in local storage to keep user logged in between page refreshes
                    localStorage.setItem('currentUser', JSON.stringify({
                      username: username,
                      token: token,
                      globaladmin: response_data.globaladmin
                    }));
                    
                    // return true to indicate successful login
                    return true;
                } else {
                    // return false to indicate failed login
                    return false;
                }
            }).catch(this.handleError);
    }
        private handleError(error: any) {
            return Observable.throw(error);
        }

    logout(): Observable<boolean> {
        let headers = new Headers({ 'Authorization': this.token, 'Content-Type': 'application/json', 'accept':'application/json' });
        let options = new RequestOptions({ headers: headers });
        this.token = null;
        localStorage.removeItem('currentUser');
        return this.http.post(this.baseurl + '/jazz/logout', JSON.stringify({}), options)
            .map((response: Response) => {
                // login successful if there's a jwt token in the response
                let response_data = response.json() && response.json().data;
                if (response_data) {
                    // clear token remove user from local storage to log user out
                    this.token = null;
                    localStorage.removeItem('currentUser');
                    // return true to indicate successful logout
                    return true;
                } else {
                    // return false to indicate failed logout
                    return false;
                }
            })
            .catch(this.handleError);
    }

    isLoggedIn(): boolean {
        if (this.token) {
            return true
        } else{
            return false;
        }
    }

    getUserId(){
        let currentUser;
        if(this.isLoggedIn()){
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
            this.userid = currentUser.username;
        }
        return this.userid;
    }

    getAuthenticatedUser() {
      if(this.isLoggedIn()) {
        return JSON.parse(localStorage.getItem('currentUser'));
      }
    }
}

