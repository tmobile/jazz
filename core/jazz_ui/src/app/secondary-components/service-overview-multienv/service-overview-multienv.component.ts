import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestService, DataCacheService, MessageService , AuthenticationService } from '../../core/services/index';
import { ToasterService} from 'angular2-toaster';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
// import { ServiceDetailComponent } from '../../service-detail/internal/service-detail.component'
// import  $  from 'jquery';
import { environment } from './../../../environments/environment';
import { environment as env_internal } from './../../../environments/environment.internal';

declare var $: any;
@Component({
  selector: 'service-overview-multienv',
  templateUrl: './service-overview-multienv.component.html',
  styleUrls: ['./service-overview-multienv.component.scss']
})
export class ServiceOverviewMultienvComponent implements OnInit {
  prodEnv: any = {};
  stgEnv: any = {};
  // Environments;
  @Output() onload: EventEmitter < any > = new EventEmitter < any > ();
  @Output() onEnvGet: EventEmitter < any > = new EventEmitter < any > ();

  flag: boolean = false;
  @Input() service: any = {};
  @Input() isLoadingService: boolean = false;
  private subscription: any;

  list_env = []
  list_inactive_env = [];
  copyLink: string = 'Copy Link';
  disp_edit: boolean = true;
  hide_email_error: boolean = true;
  hide_slack_error: boolean = true;
  service_error: boolean = true;
  disp_show: boolean = false;
  err404: boolean = false;

  response_json: any;
  show_loader: boolean = false;
  plc_hldr: boolean = true;
  status_empty: boolean;
  description_empty: boolean;
  approvers_empty: boolean;
  domain_empty: boolean;
  serviceType_empty: boolean;
  email_empty: boolean;
  slackChannel_empty: boolean;
  repository_empty: boolean;
  runtime_empty: boolean = false;
  tags_empty: boolean;
  ErrEnv: boolean = false;


  accList = env_internal.urls.accounts;
  regList = env_internal.urls.regions;
  accSelected: string = this.accList[0];
  regSelected: string = this.regList[0];

  accounts = this.accList;
  regions = this.regList;
  errMessage = ''
  tags_temp: string = '';
  desc_temp: string = '';
  bitbucketRepo: string = "";
  repositorylink: string = "";
  islink: boolean = false;
  showCancel: boolean = false;
  private toastmessage: any = '';
  // mod_status:string;
  private http: any;
  env_call:boolean = false;
  statusCompleted: boolean = false;
  serviceStatusCompleted: boolean = false;
  serviceStatusPermission: boolean = false;
  serviceStatusRepo: boolean = false;
  serviceStatusValidate: boolean = false;
  serviceStatusCompletedD: boolean = false;
  serviceStatusPermissionD: boolean = false;
  serviceStatusRepoD: boolean = false;
  serviceStatusValidateD: boolean = false;
  serviceStatusStarted: boolean = true;
  serviceStatusStartedD: boolean = false;
  statusFailed: boolean = false;
  statusInfo: string = 'Service Creation started';
  private intervalSubscription: Subscription;
  swaggerUrl: string = '';
  baseUrl: string = '';
  service_request_id: any;
  creation_status: string;
  statusprogress: number = 20;
  noStg: boolean = false;
  noProd: boolean = false;
  DelstatusInfo: string = 'Deletion Started';

  errBody: any;
  parsedErrBody: any;
  errorTime: any;
  errorURL: any;
  errorAPI: any;
  errorRequest: any = {};
  errorResponse: any = {};
  errorUser: any;
  envList = ['prod', 'stg'];
  friendlist = ['prod', 'stg'];
  errorChecked: boolean = true;
  errorInclude: any = "";
  json: any = {};
  errorcase: boolean = false;
  Nerrorcase: boolean = true;
  reqJson: any = {};
  createloader: boolean = true;
  showbar: boolean = false;
  friendly_name: any;
  list: any = {};


  constructor(

    private router: Router,
    private request: RequestService,
    private messageservice: MessageService,
    private cache: DataCacheService,
    private toasterService: ToasterService,
    // private serviceDetail:ServiceDetailComponent,
    private authenticationservice: AuthenticationService
  ) {
    this.http = request;
    this.toastmessage = messageservice;
  }

  email_temp: string;
  isenvLoading: boolean = false;
  token: string;
  noSubEnv: boolean = false;
  noEnv: boolean = false;
  slackChannel_temp: string;
  slackChannel_link: string = '';
  edit_save: string = 'EDIT';
  activeEnv: string = 'dev';
  Environments = [];
  environ_arr = [];

  // prodEnv:any;
  // stgEnv:any;
  status: string = this.service.status;
  environments = [{
      stageDisp: 'PROD',
      stage: 'prd',
      serviceHealth: 'NA',
      lastSuccess: {},
      lastError: {
        value: 'NA',
        // unit: 'Days'
      },
      deploymentsCount: {
        'value': 'NA',
        'duration': 'Last 24 hours'
      },
      cost: {
        'value': 'NA',
        'duration': 'Per Day',
        // 'status': 'good'
      },
      codeQuality: {
        'value': 'NA',
        // 'status': 'bad'
      }
    },
    {
      stageDisp: 'STAGE',
      stage: 'stg',
      serviceHealth: 'NA',
      lastSuccess: {
        value: 'NA',
        // unit: 'Days'
      },
      lastError: {},
      deploymentsCount: {
        'value': 'NA',
        'duration': 'Last 24 hours'
      },
      cost: {
        'value': 'NA',
        'duration': 'Per Day',
        // 'status': 'good'
      },
      codeQuality: {
        'value': 'NA',
        // 'status': 'good'
      }
    }

  ];

  branches = [{
      title: 'DEV',
      stage: 'dev'
    },
    {
      title: 'BRANCH1',
      stage: 'dev'
    },
    {
      title: 'BRANCH2',
      stage: 'dev'
    },
    {
      title: 'BRANCH3',
      stage: 'dev'
    },
    {
      title: 'BRANCH4',
      stage: 'dev'
    },

    // {
    //     title:'BRANCH4',
    //     stage:'dev'
    // },
    // {
    //     title:'BRANCH4',
    //     stage:'dev'
    // },
    // {
    //     title:'BRANCH4',
    //     stage:'dev'
    // }
  ];





  stageClicked(stg) {

    let url = '/services/' + this.service['id'] + '/' + stg
    this.router.navigateByUrl(url);

  }


  toast_pop(error, oops, errorMessage) {
    var tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toasterService.pop(error, oops, errorMessage);
    setTimeout(() => {
      tst.classList.remove('toaster-anim');
    }, 3000);
  }

  modifyEnvArr() {
    var j = 0;
    var k = 2;
    this.sortEnvArr();

    if (this.environ_arr != undefined) {
      for (var i = 0; i < this.environ_arr.length; i++) {
        this.environ_arr[i].status = this.environ_arr[i].status.replace("_", " ");
        // this.environ_arr[i].status=this.environ_arr[i].status.split(" ").join("\ n")
        if (this.environ_arr[i].logical_id == 'prd' || this.environ_arr[i].logical_id == 'prod') {
          this.prodEnv = this.environ_arr[i];
          continue;
        }
        if (this.environ_arr[i].logical_id == 'stg') {
          this.stgEnv = this.environ_arr[i];
          continue;
        } else {
          if (this.environ_arr[i].status !== 'archived') {
            this.Environments[j] = this.environ_arr[i];
            this.envList[k] = this.environ_arr[i].logical_id;
            if (this.environ_arr[i].friendly_name != undefined) {
              this.friendlist[k++] = this.environ_arr[i].friendly_name;
            } else {
              this.friendlist[k++] = this.environ_arr[i].logical_id;
            }
            j++;
          }
        }
      }
      this.list = {
        env: this.envList,
        friendly_name: this.friendlist
      }
    }

    if (this.Environments.length == 0) {
      this.noSubEnv = true;
    }
    if (this.prodEnv.logical_id == undefined) {
      this.noProd = true;
    }
    if (this.stgEnv.logical_id == undefined) {
      this.noStg = true;
    }

    // this.envList
    this.cache.set('envList', this.list);


  }

  sortEnvArr() {
    var j = 0;
    var k = 0;

    for (var i = 0; i < this.environ_arr.length; i++) {
      if (this.environ_arr[i].status != 'inactive') {
        this.list_env[j] = this.environ_arr[i];

        // this.list_env[i]
        j++;

      }
      if (this.environ_arr[i].status == 'inactive') {

        this.list_inactive_env[k] = this.environ_arr[i];
        k++;

            }

        }
        this.environ_arr = this.list_env.slice(0, this.list_env.length);

    this.environ_arr.push.apply(this.environ_arr, this.list_inactive_env);




  }
  getenvData() {
    this.isenvLoading = true;
    this.ErrEnv = false;
    if (this.service == undefined) {
      return
    }
    this.http.get('/jazz/environments?domain=' + this.service.domain + '&service=' + this.service.name, null, this.service.id).subscribe(
      response => {

        this.isenvLoading = false;
        this.environ_arr = response.data.environment;
        if (this.environ_arr != undefined)
          if (this.environ_arr.length == 0 || response.data == '') {
            this.noEnv = true;
          }
        this.ErrEnv = false;

        this.modifyEnvArr();

      },
      err => {
        this.isenvLoading = false;

        console.log('error', err);
        this.ErrEnv = true;
        if (err.status == 404) this.err404 = true;
        this.errMessage = "Something went wrong while fetching your data";
        this.errMessage = this.toastmessage.errorMessage(err, "environment");
        var payload = {
          "domain": +this.service.domain,
          "service": this.service.name
        }
        this.getTime();
        this.errorURL = window.location.href;
        this.errorAPI = env_internal.baseurl + "/jazz/environments";
        this.errorRequest = payload;
        this.errorUser = this.authenticationservice.getUserId();
        this.errorResponse = JSON.parse(err._body);

        // let errorMessage=this.toastmessage.errorMessage(err,"serviceCost");
        // this.popToast('error', 'Oops!', errorMessage);
      })
  };
  getTime() {
    var now = new Date();
    this.errorTime = ((now.getMonth() + 1) + '/' + (now.getDate()) + '/' + now.getFullYear() + " " + now.getHours() + ':' +
      ((now.getMinutes() < 10) ? ("0" + now.getMinutes()) : (now.getMinutes())) + ':' + ((now.getSeconds() < 10) ? ("0" + now.getSeconds()) : (now.getSeconds())));
    // console.log(this.errorTime);
  }

  feedbackRes: boolean = false;
  openModal: boolean = false;
  feedbackMsg: string = '';
  feedbackResSuccess: boolean = false;
  feedbackResErr: boolean = false;
  isFeedback: boolean = false;
  toast: any;
  model: any = {
    userFeedback: ''
  };
  buttonText: string = 'SUBMIT';
  isLoading: boolean = false;
  sjson: any = {};
  djson: any = {};
  is_multi_env: boolean = false;
  ngOnInit() {
    if (environment.multi_env) this.is_multi_env = true;
    if (environment.envName == 'oss') this.internal_build = false;
    var obj;

    this.prodEnv = {};
    this.stgEnv = {};
    if(!this.env_call){
      if((this.service.domain!=undefined)){
        this.env_call = true;

          this.getenvData();

      }
  }
  }

  testingStatus() {
    setInterval(() => {
      this.onload.emit(this.service.status);
    }, 500);
  }
  transform_env_oss(data) {
    //   alert('ososos')
    var arrEnv = data.data.environment
    if (environment.multi_env) {
      for (var i = 0; i < arrEnv.length; i++) {
        arrEnv[i].status = arrEnv[i].status.replace('_', ' ');
        if (arrEnv[i].logical_id == 'prod')
          this.prodEnv = arrEnv[i];
        else
          this.Environments.push(arrEnv[i]);
      }
    } else {
      for (var i = 0; i < arrEnv.length; i++) {
        arrEnv[i].status = arrEnv[i].status.replace('_', ' ');
        if (arrEnv[i].logical_id == 'prod')
          this.prodEnv = arrEnv[i];
        else
          this.stgEnv = arrEnv[i];
      }
    }
    arrEnv[0].status.replace("_", " ");
  }

  refresh(){
    if(this.service.domain!=undefined){
        this.getenvData();
    }
  }

  internal_build: boolean = true;
  ngOnChanges(x: any) {
    if (environment.multi_env) this.is_multi_env = true;
    if (environment.envName == 'oss') this.internal_build = false;
    var obj;

    if(!this.env_call){

      if((this.service.domain!=undefined)){
        this.env_call = true;
          this.getenvData();
      }
  }


  }
  ngOnDestroy() {

  }

  public goToAbout(hash) {
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag', true);
    this.cache.set('scroll_id', hash);
  }

  scrollList: any;


}
