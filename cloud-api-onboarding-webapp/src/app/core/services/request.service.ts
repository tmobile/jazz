/** 
  * @type Service 
  * @desc Service
  * @author
*/

import { Injectable } from '@angular/core';
import { Http, Headers, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { AuthenticationService } from '../../core/services/index';
import 'rxjs/add/operator/map';
import { ConfigService } from '../../app.config';


@Injectable()
export class RequestService {
    public token: string;
    public baseurl: string;
    private _config: any;

    constructor(private http: Http, private authenticationService: AuthenticationService, private config: ConfigService) {
        // set token if saved in local storage
        let currentUser;
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.token = currentUser && currentUser.token;
        this.baseurl = config.getConfiguration().baseurl;
        console.log("baseurl - ",this.baseurl)
    }

    constructUrl(url: string): string {
        var urlPattern = /^https?:\/\//i;

        if (urlPattern.test(url)) {

            // if url provided is an absolute url, use it as is
            return url;
        } else{

            // if url is a relative url append basepath
            if (!url.startsWith("/")) {
                url = "/" + url
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
            // .catch((error:any) => Observable.throw(error.json().error || 'Server error'));
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
            // .catch((error:any) => Observable.throw(error.json().error || 'Server error'));;
    }
}

