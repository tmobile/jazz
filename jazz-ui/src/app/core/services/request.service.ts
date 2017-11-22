/** 
  * @type Service 
  * @desc Request Service - wrapper around angular2's Http service
  * @author Sunil Fernandes
*/

import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from '../../core/services/authentication.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { ConfigService } from '../../app.config';
import { Router } from '@angular/router';
import {ServiceCostComponent} from '../../pages/service-cost/service-cost.component'

@Injectable()
export class RequestService {
    public token: string;
    public baseurl: string;
    private _config: any;

    constructor(private http: Http, private authenticationService: AuthenticationService, private config: ConfigService, private router: Router) {
        // set token if saved in local storage
        let currentUser;
        currentUser = JSON.parse(localStorage.getItem("currentUser"));
        this.token = currentUser && currentUser.token;
        this.baseurl = config.getConfiguration().baseurl;
    }

    constructUrl(url: string): string {
        var urlPattern = /^https?:\/\//i;

        if (urlPattern.test(url)) {

            // if url provided is an absolute url, use it as is
            return url;
        } else{

            // if url is a relative url append basepath
            if (!url.startsWith("/")) {
                url = url + "/"
            }
            return this.baseurl + url;
        }
    }

    get(url: string, query: any = {}): Observable<any> {
        // Make a GET request to url

        url = this.constructUrl(url);

        // Get Authentication token
        this.token = this.authenticationService.getToken();

        // Add Authentication token to headers
        let headerObj = {
            'Authorization': this.token,
            'Content-Type': 'application/json',
            'accept':'application/json'
        };
        let headers = new Headers(headerObj);
        let options = new RequestOptions({ headers: headers });
        let router = this.router;

        return this.http.get(url, options )
            .map((response: Response) => {
                let responseBody;
                responseBody = response.json();
                if (responseBody !== undefined) {
                    // return responseBody to indicate successfull GET request

                    return responseBody;
                } else {
                    let err = {result:'error', message: 'Unexpected error.'};

                    // return error to indicate failed request
                    return (responseBody.error || err);
                }
            })
             .catch((err: Response): any => {
                 console.log(err.status);
                return this.handleError(err, router);
            })
             //.catch((err: Response): any => Observable.throw(error.json().error || 'Server error'));
    }

    post(url: string, body: any): Observable<any> {
        // Make a POST request to url
        
        // Construct url
        url = this.constructUrl(url);

        // Get Authentication token
        this.token = this.authenticationService.getToken();

        // Add Authentication token to headers
        let headerObj = {
            'Authorization': this.token,
            'Content-Type': 'application/json',
            'accept':'application/json'
        };
        let headers = new Headers(headerObj);
        let options = new RequestOptions({ headers: headers });
        let router = this.router;

        return this.http.post(url, JSON.stringify(body), options)
            .map((response: Response) => {
                let responseBody;
                responseBody = response.json();
                if (responseBody) {

                    return responseBody;
                } else {
                    // return error responseBody
                    return responseBody;
                }
            })
            // .catch(this.handleError)
            .catch((error: any) => {
                
                return this.handleError(error, router);
            })
            // .catch((error:any) => Observable.throw(error.json().error || 'Server error'));;
    }

    put(url: string, body: any): Observable<any> {
        // Make a PUT request to url
        
        // Construct url
        url = this.constructUrl(url);

        // Get Authentication token
        this.token = this.authenticationService.getToken();

        // Add Authentication token to headers
        let headerObj = {
            'Authorization': this.token,
            'Content-Type': 'application/json',
            'accept': 'application/json'
        };
        let headers = new Headers(headerObj);
        let options = new RequestOptions({ headers: headers });
        let router = this.router;
        // console.log('opitons:', options);

        return this.http.put(url, JSON.stringify(body), options)
            .map((response: Response) => {
                // console.log('put response:', response);
                let responseBody;
                responseBody = response.json();
                if (responseBody) {

                    return responseBody;
                } else {
                    // return error responseBody
                    return responseBody;
                }
            })
             .catch((error: any) => {
                 console.log('put error:', JSON.parse(error));
                return this.handleError(error, router);
            })
           
    }
    private handleError(error: any, router:any) {
        console.log(error);
       
        if(error.status === 401 || error.status === 403){
            if (router) {
               router.navigateByUrl('');//route to landing page
               this.authenticationService.logout();
            }
        }
        else if(error.message !== undefined && error.message ==="Unauthorized")
        {
            if (router) {
               router.navigateByUrl('');//route to landing page
               this.authenticationService.logout();
            }
        }
        
        return Observable.throw(error);
    }
}

