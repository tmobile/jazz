/**
  * @type Component
  * @desc Service overview page
  * @author
*/

import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RequestService, MessageService } from '../../core/services/index';
import { ToasterService} from 'angular2-toaster';
import {DOCUMENT} from "@angular/platform-browser";
import { ConfigService } from '../../app.config';

 
@Component({
    selector: 'service-overview',
    templateUrl: './service-overview.component.html',
    providers: [RequestService, MessageService],
    styleUrls: ['../service-detail/service-detail.component.scss','./service-overview.component.scss']
})

export class ServiceOverviewComponent implements OnInit {

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
        this.api_doc_name = configService.getConfiguration().api_doc_name;
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
            stage : 'prd',
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

    openLink(link){
        if (link) {
            if(link.indexOf("http://") != 0)
            {
                window.open("http://"+link, "_blank");
            }
            else
            window.open(link, "_blank");
        }
    }

    stageClicked(stg){
        if (this.activeEnv != stg) {
            this.activeEnv = stg
        } else{
            let url = '/services/' + this.service['id'] + '/' + stg
            this.router.navigateByUrl(url);
            // Temporarily Masked
        }
    }
    ValidURL(str) {
        var regex = /(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if(!regex .test(str)) {
          return false;
        } else {
          return true;
        }
      }
      onEditClick(){
        this.check_empty_fields();
        if(this.service.status && this.service.status != 'deletion_completed' && this.service.status != 'deletion_started'){
        };
        if(!this.disp_show)
        {//set edit view to true ---> switch to edit mode
            this.disp_edit=false;
            this.disp_show=true;
            this.edit_save='SAVE';
        }
        else{//set display view to true ---> save and switch to view mode
            this.isLoadingService=true;
            this.validateChannelName();

            var payload = {
                "email": this.service.email || "",
                "slack_channel": this.service.slackChannel || "",
                "tags": this.service.tags || "",
                "description": this.service.description  || ""
            };
            this.http.put('/platform/services/'+this.service.id, payload)
            .subscribe(
                (Response)=>{
                    this.isLoadingService=false;
                    this.disp_edit=true;
                    this.disp_show=false;
                    this.edit_save='EDIT';
                    let successMessage = this.toastmessage.successMessage(Response,"updateObj");
                    this.toast_pop('success',"", "Service: "+this.service.name +" "+successMessage);
                },
                (Error)=>{
                    this.isLoadingService=false;
                    this.disp_edit=false;
                    this.disp_show=true;
                    this.edit_save='SAVE';
                    let errorMessage = this.toastmessage.errorMessage(Error,"updateObj");
                    this.toast_pop('error', 'Oops!', errorMessage)
                }
            );
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
    testApi(type,stg)
    {
        switch(type){
            case 'api':
            this.swaggerUrl = "http://editor.swagger.io/?url="+this.api_doc_name+"/"+this.service.domain +"/"+ this.service.name +"/"+stg+"/swagger.json";
            window.open(this.swaggerUrl);
            break;
            case 'website' : window.open(this.service.endpoints[stg]);
            break;
        }
    }


    copyClipboard(copyapilinkid){
        var element = null; // Should be <textarea> or <input>
        element = document.getElementById(copyapilinkid);
        element.select();
        try {
            document.execCommand("copy");
            this.copylinkmsg = "LINK COPIED";
        }
        finally {
           document.getSelection().removeAllRanges;
        }
     }

    myFunction() {
        setTimeout( this.resetCopyValue(), 3000);
     }

     resetCopyValue(){
        this.copylinkmsg = "COPY LINK TO CLIPBOARD";
     }

    checkSlackNameAvailability()
    {

        this.validateChannelName();
        return;
    }

    check_email_valid()
    {
        var regex=/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

        if(this.email_temp == '' || this.email_temp == null || this.email_temp == undefined)
        {
            this.hide_email_error = true;
            this.button_unclickable=false;
            this.service.email=this.email_temp;
        }
        else
        {
            if(!regex.test(this.email_temp))//if it doesnt match with email pattern
            {
                this.hide_email_error=false;
               this.email_valid=false;
               this.button_unclickable=true;
            }
            else//email matches
                {
                    this.hide_email_error=true;

                    this.service.email=this.email_temp;
                    this.email_valid=true;
                    this.button_unclickable=false;

                }
        }

    }


    public validateChannelName() {

        this.button_unclickable=true;
        this.show_loader=true;
        if(this.slackChannel_temp == '' || this.slackChannel_temp == null){
            this.button_unclickable=false;
            this.hide_slack_error=true;
            this.show_loader=false;
        }
        else{
            this.http.get('/platform/is-slack-channel-available?slack_channel='+this.slackChannel_temp)
            .subscribe(
                (Response) => {
                    let isAvailable = Response.data.is_available;
                    if(isAvailable)//if valid
                    {
                        this.hide_slack_error=true;
                        this.button_unclickable=false;
                        this.service.slackChannel=this.slackChannel_temp;

                    }
                    else
                    {
                        this.hide_slack_error=false;
                        this.button_unclickable=true;
                    }
                    this.show_loader=false;
                },
                (error) => {
                    var err = error;
                    this.show_loader=false;

                }

            );
        }
     }





    slack_link(){

        if(this.service.slackChannel == '' || this.service.slackChannel == undefined)
        {
            //do nothing
        }
        else{
            this.slackChannel_link='https://t-mo.slack.com/messages/' + this.service.slackChannel;
            this.openLink(this.slackChannel_link);
        }
    }

    check_empty_fields()
    {
        if(this.service.description == undefined || this.service.description == null || this.service.description == '')
        {
            this.description_empty=true;
        }
        else{
            this.description_empty=false;
        }
        if(this.service.approvers == undefined || this.service.approvers == null || this.service.approvers == '')
        {
            this.approvers_empty=true;
        }
        if(this.service.domain == undefined || this.service.domain == null || this.service.domain == '')
        {
            this.domain_empty=true;
        }
        if(this.service.serviceType == undefined || this.service.serviceType == null || this.service.serviceType == '')
        {
            this.serviceType_empty=true;
        }
        if(this.service.email == undefined || this.service.email == null || this.service.email == '')
        {
            this.email_empty=true;
        }
        else{this.email_empty=false;this.email_temp=this.service.email}
        if(this.service.slackChannel == undefined || this.service.slackChannel == null || this.service.slackChannel == '')
        {
            this.slackChannel_empty=true;
        }
        else{ this.slackChannel_empty=false;this.slackChannel_temp=this.service.slackChannel }
        if(this.service.repository == undefined || this.service.repository == null || this.service.repository == '')
        {
            this.repository_empty=true;
        }
        if(this.service.runtime == undefined || this.service.runtime == null || this.service.runtime == '')
        {
            this.runtime_empty=true;
        }
        if(this.service.tags == undefined || this.service.tags == null || this.service.tags == '')
        {
            this.tags_empty=true;
        }
        else{this.tags_empty=false;}
    }
    ngOnInit() {
    }
    ngOnChanges(x:any){

        console.log(this.service.endpoints);
    this.check_empty_fields();
        this.islink = this.ValidURL(this.service.repository);
        if(this.islink){
            this.bitbucketRepo = "Bitbucket Link";
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
            document.getElementById('current-status-val').setAttribute("style","width:"+statusprogress+'%');
    }
}
