/** 
  * @type Component 
  * @desc Login Page
  * @author
*/

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToasterService} from 'angular2-toaster';

import { AuthenticationService } from '../../core/services/index';


@Component({
    // moduleId: module.id,
    selector: 'login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
    model: any = {
        username: '',
        password: ''
    };
    error: any = {
        username: '',
        password: ''
    };
    loading = false;
    buttonText = 'LOGIN';

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private toasterService: ToasterService) {

        this.toasterService = toasterService;

    }

    ngOnInit() {
        // to reset login status
        // this.authenticationService.logout();
    }
    public goToService () {
        this.router.navigateByUrl('/services');
    }

    login() {
        //clear error first
        this.error = {}

        // validate username
        if (!this.model.username) {
            this.error.username = 'Username cannot be empty';
        }
        // validate password
        if (!this.model.password) {
            this.error.password = 'Password cannot be empty';
        }
        // ... other validations

        // if no validation errors try login
        if (this.error.username === undefined && this.error.password === undefined) {
            this.loading = true;
            this.authenticationService.login(this.model.username, this.model.password)
                .subscribe(result => {
                    this.loading = false;
                    if (result === true) {
                        // login successful
                        this.router.navigate(['/services']);
                    } else {
                        // login failed
                        this.toasterService.pop('error', 'Login Failed', '');
                    }
                }, error => {
                    this.loading = false;
                    if (error !== undefined && error.status !== undefined) {
                        if (error.status == 0) {
                            this.toasterService.pop('error', 'Login Failed', 'Server cannot be reached at the moment');
                        } else if(error.status == 401){
                            // this.toasterService.pop('error', 'Login Failed', 'Unauthorised');
                            this.error.username = 'Invalid username or password.';
                            this.model.password = '';
                        }
                        // code...
                    } else{
                        this.toasterService.pop('error', 'Login Failed', 'Unexpected Error.');
                    }
                });
        }
    }
}
