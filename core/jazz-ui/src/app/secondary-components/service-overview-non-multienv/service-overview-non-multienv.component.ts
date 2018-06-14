
import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestService, MessageService } from '../../core/services/index';
import { ToasterService} from 'angular2-toaster';
import { DOCUMENT } from "@angular/platform-browser";
import { ConfigService } from '../../app.config';

 
@Component({
  selector: 'service-overview-non-multienv',
  templateUrl: './service-overview-non-multienv.component.html',
  styleUrls: ['./service-overview-non-multienv.component.scss']
})
export class ServiceOverviewNonMultienvComponent implements OnInit {

  
    @Input() service: any = {};
    @Input() isLoadingService: boolean = false;
    private dom: Document;
    disp_edit:boolean= true;
    hide_email_error:boolean = true;
    hide_slack_error:boolean = true;
    disp_show:boolean = false;
    disable_button:boolean = false;
    email_valid:boolean;
    button_unclickable:boolean=false;
    slack_valid:boolean;
    response_json:any;
    show_loader:boolean = false;
    plc_hldr:boolean = true;
    status_empty:boolean;
    description_empty:boolean;
    approvers_empty:boolean;
    domain_empty:boolean;
    serviceType_empty:boolean;
    email_empty:boolean;
    slackChannel_empty:boolean;
    repository_empty:boolean;
    runtime_empty:boolean;
    tags_empty:boolean;
    bitbucketRepo:string = "";
    repositorylink:string = "";
    islink:boolean = true;
    copylinkmsg: any = "COPY LINK TO CLIPBOARD";
    private toastmessage:any = '';
    private http:any;
    swaggerUrl:string='';
    api_doc_name:string='';
    copyapi: any;

    constructor(
        private router: Router,
        private request: RequestService,
        private messageservice:MessageService,
        private toasterService: ToasterService,
        private configService:ConfigService
    ) {
        this.http = request;
        this.toastmessage = messageservice;
       // this.api_doc_name = configService.getConfiguration().api_doc_name;
    }

    email_temp:string;
    slackChannel_temp:string;
    slackChannel_link:string = '';
    edit_save:string = 'EDIT';
    activeEnv:string = 'dev';
    status :string= this.service.status;
    environments = [
        {
            stage : 'dev',
            serviceHealth : 'good',
            lastSuccess : {
                value: 1,
                unit: 'Day'
            },
            lastError : {
                value: 2,
                unit: 'Days'
            },
            deploymentsCount : {
                'value':'15',
                'duration':'Last 24 hours'
            },
            cost : {
                'value': '$30.4',
                'duration': 'Per Day',
                'status': 'bad'
            },
            codeQuality : {
                'value': '83%',
                'status': 'good'
            }
        },
        {
            stage : 'prod',
            serviceHealth : 'bad',
            lastSuccess : {},
            lastError : {
                value: 5,
                unit: 'Days'
            },
            deploymentsCount : {
                'value':'5',
                'duration':'Last 24 hours'
            },
            cost : {
                'value': '$2.94',
                'duration': 'Per Day',
                'status': 'good'
            },
            codeQuality : {
                'value': '43%',
                'status': 'bad'
            }
        }
        //Temporarily Masked
    ];

    

    stageClicked(stg){
        if (this.activeEnv != stg) {
            this.activeEnv = stg
        } else{
            let url = '/services/' + this.service['id'] + '/' + stg
            this.router.navigateByUrl(url);
            // Temporarily Masked
        }
    }
    
    toast_pop(error,oops,errorMessage)
    {
      var tst = document.getElementById('toast-container');
         tst.classList.add('toaster-anim');
        this.toasterService.pop(error,oops,errorMessage);
        setTimeout(() => {
            tst.classList.remove('toaster-anim');
          }, 3000);
    }
    


    

  

  

   
    ngOnInit() {
    }
    ngOnChanges(x:any){

        if(this.islink){
            this.bitbucketRepo = "Git Repo";
            this.repositorylink = this.service.repository;
        } else if(this.service.repository === "[Archived]"){
            this.bitbucketRepo = "Archived";
            this.repositorylink = "";
        }

        let statusprogress;
        if(this.service.status == 'creation started'){
            statusprogress = 0;
        } else if(this.service.status == 'creation completed'){
            statusprogress = 100;
        } else if(this.service.status == 'deletion failed'){
            statusprogress = 50;
        }else if(this.service.status == 'deletion completed'){
            statusprogress = 100;
        }
    }
}
