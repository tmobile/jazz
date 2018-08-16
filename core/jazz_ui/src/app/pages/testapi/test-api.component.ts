import { Component, OnInit } from '@angular/core';
import { RequestService, DataCacheService, MessageService } from '../../core/services';
import { Router, ActivatedRoute, Params } from '@angular/router';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'test-api',
  templateUrl: './test-api.component.html',
  styleUrls: ['./test-api.component.scss']
})


export class TestApiComponent implements OnInit {

  constructor(
    private http: RequestService,
    private cache: DataCacheService,
    private router: Router,
  private activatedroute : ActivatedRoute) { }

  private subscription:any;
    loadingpage: boolean = true;
    errorText: string = '';
    errorHeader: string = '';
    // change:boolean = false;
    serviceInfo: any;
    isAvailable:boolean=true;
    serviceName:string;
    domainName: string;
    status:string;
    private intervalSubscription: Subscription;
    updateinterval = 10000;
    isServiceAvail:string;
    swaggerUrl:string='';
    settime:boolean = false;
    count = 59;
    timeset:any='00:'+ this.count;
    retryInterval:any;
    envSelected:string = '';
    noLink:boolean = true;
    goToLogin:boolean = false;
    closed:boolean=true;

    backtohome() {
        this.router.navigateByUrl('');
    }

    isSwaggerAvailable(){
      this.loadingpage = true;
      this.http.get(this.isServiceAvail).subscribe(
        response => {
          //route to swagger editor page
          window.open(this.swaggerUrl, '_self');
        }, error => {
          //set timeout can be used for polling or try again purpose
          //   setTimeout(() => {
          //     this.settime = true;
          //     this.testCount();
          //   }, this.updateinterval);
            this.loadingpage = false;
        }
      );
    }

    testCount () {
      this.timeset = '00:' + this.count;
      this.retryInterval = setInterval(() => {
        this.count--;
        this.timeset = '00:' + this.count;
        if (this.count === -1) {
          this.retryAgain();
        } else if (this.count < 10) {
          this.timeset = '00:0' + this.count;
        }
      }, 1000);
    };
    retryAgain(){
      this.count = 59;
      this.loadingpage = true;
      this.settime = false;
      clearInterval(this.retryInterval);
      this.isSwaggerAvailable();
    }

    public goToAbout(hash){
      this.router.navigateByUrl('landing');
      this.cache.set('scroll_flag', true);
      this.cache.set('scroll_id', hash);
   }

   public onLoginClicked (goToLogin) {
    this.goToLogin = goToLogin;
    this.closed = false;
}

public closeSidebar (eve){
    this.goToLogin = false;
    this.closed = true;
}
cloudapiURL:string; 
editor_cloudapiURL:string; 
  ngOnInit() {
    var ENV='';
    this.activatedroute.queryParams.subscribe((params: Params) => {
      this.serviceName = params['service'];
      this.domainName = params['domain'];
      this.envSelected = params['env'];
    });

    switch(this.envSelected){}
    if(this.envSelected == 'prd' || this.envSelected == 'prod'){
      ENV='/'+this.envSelected;
      this.envSelected='';
    }else if(this.envSelected == 'stg'){
      ENV='/'+this.envSelected;
      this.envSelected = this.envSelected +'-'
    }
    else{
      ENV='/'+this.envSelected;
      this.envSelected='dev-';
    }   
    this.isServiceAvail = 'http://'+this.envSelected+this.cloudapiURL+'/' + this.domainName + '_' + this.serviceName +ENV +'/swagger.json'    
    this.swaggerUrl = this.editor_cloudapiURL+this.isServiceAvail;
    this.isSwaggerAvailable();
  }
}
