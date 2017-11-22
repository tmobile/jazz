/**
  * @type Component
  * @desc Login Page
  * @author
*/

import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ToasterService} from 'angular2-toaster';
import { RequestService, AuthenticationService, MessageService } from '../../core/services/index';

import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';


@Component({
    selector: 'login',
    templateUrl: './login.component.html',
    providers: [RequestService, MessageService],
    styleUrls: ['./login.component.scss']
})

export class LoginComponent implements OnInit {
    private toastmessage:any;
    popoverTitle:string="Username";
    regist:string="Forgot Password";
    popoverSubTitle:string="Login with your CORP ID";
    tst:any;
    error_disp:boolean=false;
    err_brd:boolean=false;
    popoverContent:string="";
    toast : any;
    id: string;
    register:boolean = false;
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
    http:any;
    error_username_disp:boolean=false;
    err_username_brd:boolean=false;
    error_password_disp:boolean=false;
    err_password_brd:boolean=false;
    forgot_password:boolean=false;
    userEmail:string= 'User Email';

    constructor(
        private router: Router,
        private authenticationService: AuthenticationService,
        private toasterService: ToasterService,
        private messageservice: MessageService,
        private request: RequestService) {

        this.toasterService = toasterService;
        this.toastmessage =messageservice;
        this.http = request;

    }

    modelFill()
    {
        this.model.username=this.email;
        this.model.password=this.password;
    }
    ngOnInit() {
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
          }, 6500);

    }

    onChange(val) {
        this.error_username_disp=false;
        this.err_username_brd=false;
        this.error_password_disp=false;
        this.err_password_brd=false;
      }

    toggleReg(selected){
       this.onChange(selected);
       this.model.username=this.model.password="";

        if(selected == 'register'){
            this.register = true;
            this.regist='Back to login';
        } else if(selected == 'newPassword'){
            this.register = false;
            if(this.regist == 'Forgot Password'){
                this.userEmail = 'Registered Email';
                this.forgot_password=true;
                this.regist='Back to login';
            } else{
                this.userEmail = 'User Email';
                this.forgot_password=false;
                this.regist='Forgot Password';
            }

        }
    }

    login() {
        if(this.register || this.forgot_password)
        return;
        //clear error first
        this.error = {}

        // validate username
        if (!this.model.username && !this.register) {
            this.error_username_disp = true;
            this.err_username_brd = true;
            this.error.username = 'Username cannot be empty';
        }
        // validate password
        if (!this.model.password && !this.register) {
            this.error_password_disp= true;
            this.err_password_brd = true;
            this.error.password = 'Password cannot be empty';
            this.register=false;
        }
        
        // ... other validations

        // if no validation errors try login
        if (this.error.username === undefined && this.error.password === undefined) {
            this.loading = true;
            this.authenticationService.login(this.model.username.replace('CORP\\',''), this.model.password)
                .subscribe(result => {
                    this.loading = false;
                    if (result === true) {
                        // login successful
                        this.router.navigate(['/services']);
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
                            this.toast_pop('error', 'Oops!', errorMessage);
                        } else if(error.status == 401){
                            this.error.username = '  ';
                            this.error.password=errorMessage;
                            this.error_password_disp=true;
                            this.err_username_brd=true;
                            this.err_password_brd=true;
                        }else{
                        let errorbody = JSON.parse(error._body);
                        this.toast_pop('error', 'Oops!', errorbody.message);

                    }
                        // code...
                    } else{
                        this.toast_pop('error', 'Oops!', errorMessage);

                    }
                });


            }


        }
        clearRegForm(){
            this.model.username='';
            this.model.password='';
            this.model.usercode='';
            
        }

        registerUser(e){
            if (e.keyCode == 13) {
                e.preventDefault();
                return false;
            }
            if (!this.model.usercode) {
                this.error_disp = true;
                this.error.usercode = 'Usercode cannot be empty';
            }
            let payload = {
                            "userid": this.model.username,
                            "userpassword":this.model.password,
                            "usercode":this.model.usercode
                        }
            this.http.post('/platform/usermgmt', payload).subscribe(
                response => { 
                    //Registration changes here
                    let message=this.toastmessage.successMessage("success","register");
                    this.toast_pop('success', '', message + this.model.username);
                    this.clearRegForm();
                    this.toggleReg('register');
                },
        err => {
            let error = JSON.parse(err._body);
            let errorMessage=this.toastmessage.errorMessage(err,"register");
            this.toast_pop('error', 'Oops!', error.message);
        });
        }
        resetPassword(e){
            this.http.get('/platform/usermgmt/reset?email=' + this.model.username).subscribe(
                response =>{
                    console.log(response);
                }, error => {
                    console.log(error);
                }
            );
            this.register = false;
            this.userEmail = 'User Email';
            this.forgot_password=false;
            this.regist='Forgot Password';
            this.onChange(e);
            this.model.username=this.model.password="";
        }
}
