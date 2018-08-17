/**
  * @type Component
  * @desc Login Page
  * @author
*/

import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ToasterService} from 'angular2-toaster';
import { AuthenticationService, MessageService } from '../../../core/services/index';
import { DataCacheService } from '../../../core/services/index';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { environment as env_internal } from './../../../../environments/environment.internal';


@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    providers: [MessageService],
    styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
    private toastmessage:any;
    popoverTitle:string="Username";
    popoverSubTitle:string="Login with your CORP ID";
    tst:any;
    error_username_disp:boolean=false;
    error_password_disp:boolean=false;
    err_username_brd:boolean=false;
    err_password_brd:boolean=false;
    popoverContent:string="";
    toast : any;
    id: string;
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
    email:string='';
    password:string='';

    constructor(
        private router: Router,
        private cache: DataCacheService,
        private authenticationService: AuthenticationService,
        private toasterService: ToasterService,
        private messageservice: MessageService) {

        this.toasterService = toasterService;
        this.toastmessage =messageservice;

    }

    modelFill()
    {
        this.model.username=this.email;
        this.model.password=this.password;
    }
    ngOnInit() {
        // to reset login status
        this.model.username = env_internal.urls.username_prefix;


        //to add animation class 
        this.tst = document.getElementById('toast-container');

    }

    public goToService () {
        this.router.navigateByUrl('/services');
    }

    toast_pop(error,oops,errorMessage)
    {
        var tst = document.getElementById('toast-container');

         tst.classList.add('toaster-anim');                            
        this.toast = this.toasterService.pop(error,oops,errorMessage);        
        setTimeout(() => {
            tst.classList.remove('toaster-anim');
          }, 3000);
        
    }

    onChange(val) {
        this.error_username_disp =false;
        this.err_username_brd = false;
        this.error_password_disp = false;
        this.err_password_brd =false;
      }

    login() {

        //clear error first
        this.error = {}

        // validate username
        if (!this.model.username || this.model.username === env_internal.urls.username_prefix) {
            this.error_username_disp=true;
            this.err_username_brd=true;
            this.error.username = 'Username cannot be empty';
        }
        // validate password
        if (!this.model.password) {
            this.error_password_disp=true;
            this.err_password_brd=true;
            this.error.password = 'Password cannot be empty';
        }
        // ... other validations

        // if no validation errors try login
        if (this.error.username === undefined && this.error.password === undefined) {
            this.loading = true;
            var username = this.model.username;
            var pre = username.substring(0,5).toLowerCase();
            
            if (pre == env_internal.urls.username_prefix.toLowerCase()){
                username = username.substring(5,username.length);
            }       
            this.authenticationService.login(username, this.model.password)
                .subscribe(result => {
                    if (result === true) {
                        // login successful
                        this.router.navigate(['/services']);
                        this.cache.set(this.model.username,true);
                    } else {
                        // login failed
                        //let successMessage  = this.toastmessage.successMessage("false","login");
                        //this.toasterService.pop('error', 'Oops!',successMessage);
                    }
                }, error => {
                    this.loading = false;
                    let errorMessage=this.toastmessage.errorMessage(error,"login");
                    if (error !== undefined && error.status !== undefined) {
                        if (error.status == 0) {

                            //add animation class before the toast pop
                            //this.tst.classList.add('toaster-anim');                            
                            this.toast_pop('error', 'Oops!', errorMessage);
                        } else if(error.status == 401){


                         //   this.tst.classList.add('toaster-anim');
                            this.error.username = '  ';
                            this.error.password=errorMessage;
                            this.err_username_brd = true;
                            this.error_password_disp = true;
                            this.err_password_brd =true;
                            //this.toasterService.pop('error', 'Oops!', errorMessage);
                        }
                        // code...
                    } else{
                        //this.tst.classList.add('toaster-anim');
                        this.toast_pop('error', 'Oops!', errorMessage);
                           
                    }
                });
     
     
            }
            
            
        }
        ngOnChanges(x:any){
           
            
        }
}

