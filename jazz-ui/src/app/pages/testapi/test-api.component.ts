import { Component, OnInit } from '@angular/core';
import { RequestService, DataCacheService, MessageService } from '../../core/services';
import { Router, ActivatedRoute, Params } from '@angular/router';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { ConfigService } from '../../app.config' 

@Component({
  selector: 'test-api',
  templateUrl: './test-api.component.html',
  styleUrls: ['./test-api.component.scss']
})


export class TestApiComponent implements OnInit {

  api_doc_name:string='';
  constructor(
    private http: RequestService,
    private cache: DataCacheService,
    private router: Router,
    private activatedroute : ActivatedRoute,
    private configService:ConfigService) { 
      this.api_doc_name = configService.getConfiguration().api_doc_name;
    }

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
    swaggerEnv:string='';

    backtohome() {
        this.router.navigateByUrl('');
    }

    isSwaggerAvailable(){
      this.loadingpage = true;
      window.open(this.swaggerUrl, '_self');
      // this.http.get(this.isServiceAvail).subscribe(
      //   response => {
      //     //route to swagger editor page
      //     window.open(this.swaggerUrl, '_self');
      //   }, error => {
      //     //set timeout can be used for polling or try again purpose
      //     //   setTimeout(() => {
      //     //     this.settime = true;
      //     //     this.testCount();
      //     //   }, this.updateinterval);
      //       this.loadingpage = false;
      //   }
      // );
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

  ngOnInit() {
    this.activatedroute.queryParams.subscribe((params: Params) => {
      this.serviceName = params['service'];
      this.domainName = params['domain'];
      this.envSelected = params['env'];
    });
    if(this.envSelected === 'prd'){
      this.envSelected='';
      this.swaggerEnv='prod'
    }else{
      this.swaggerEnv = this.envSelected;
      this.envSelected = this.envSelected + '-';
    }
    // this.baseUrl="http://jazz-training-api-doc.s3-website-us-east-1.amazonaws.com"
    this.isServiceAvail = 'http://'+this.envSelected+'cloud-api-doc.corporate.t-mobile.com/' + this.domainName + '_' + this.serviceName + '/swagger.json'    
    // this.swaggerUrl = 'http://editor.swagger.io/#/?no-proxy&import='+this.isServiceAvail;
    this.swaggerUrl="http://editor.swagger.io/?url="+this.api_doc_name+"/"+this.domainName +"/"+ this.serviceName +"/"+this.swaggerEnv+"/swagger.json"
    console.log(this.swaggerUrl);
    this.isSwaggerAvailable();
    console.log(this.isServiceAvail);
  }
}
