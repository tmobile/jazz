/** 
  * @type Component 
  * @desc Service detail page
  * @author
*/
import { Http, Headers, Response } from '@angular/http';
import { Component, OnInit , Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from "../../SharedService.service";
import { RequestService } from "../../core/services";
import { ToasterService} from 'angular2-toaster';
@Component({
    selector: 'service-detail',
    templateUrl: './service-detail.component.html',
    styleUrls: ['./service-detail.component.scss'],
    providers: [RequestService]
})

export class ServiceDetailComponent implements OnInit {

    constructor(
        private toasterService: ToasterService,
        private route: ActivatedRoute,
        private router: Router,
        private sharedService: SharedService,
        private http: RequestService
    ) { 
        this.message = this.sharedService.sharedMessage;
    }
    message;

    @Output() deleteServiceStatus:EventEmitter<boolean> = new EventEmitter<boolean>();

    disblebtn:boolean = true;
    ServiceName:string;
    deleteServiceVal:boolean;
    id: string;
    private sub: any;

    isLoading: boolean = false;
    selectedTab = 0;
    selected:string = 'All';
    service: any = {};
    stageOverview: any = {};
    showPopUp:boolean = false;
    success:boolean = false;
    thisIndex : number = 0;
    serviceRequestFailure = false;
    serviceRequestSuccess = false;

    statusData = ['All','Active','Pending','Stopped'];
    tabData = ['OVERVIEW', 'ACCESS CONTROL', 'COST', 'METRICS', 'LOGS'];


    breadcrumbs = []
    

    serviceData = {
        service :{
                id: '1',
                name : 'Service One',
                serviceType : 'API',
                runtime : 'Python',
                status : 'Active',
                description : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                approvers : 'Jane Smith',
                domain : 'tmo.com',
                email : 'api@tmo.com',
                slackChannel : 'Cloud Notifications',
                repository : 'View on BitBucket',
                tags : 'Pacman, MyService'
        }
    };

    processService(service){
        if (service === undefined) {
            return {};
        } else{
            return {
                id: service.id,
                name: service.service,
                serviceType: service.type,
                runtime: service.runtime,
                status: service.status,
                description: service.description,
                approvers: service.approvers,
                domain: service.domain,
                email: service.email,
                slackChannel: service.slackChannel,
                repository: service.repository,
                tags: service.tags
            };
        }
    };

    fetchService(id: string){
        this.isLoading = true;

        this.http.get('/platform/services/'+id).subscribe(
          response => {
              //Bind to view
              let service = response.data;

              if (service !== undefined && service !== "") {
                this.service = this.processService(service);
                this.serviceData.service = this.service;
                this.isLoading = false;
              } else{
                this.isLoading = false;
                this.toasterService.pop('error', 'Error', 'No data recieved')
              }
            },
            err => {
                this.isLoading = false;
                this.toasterService.pop('error', 'Error', 'Service list could not be fetched.')
            }
          )
    };


    
    onSelectedDr(selected){
        this.selectedTab = selected;
    }

    tabChanged (i) {
        this.selectedTab = i;
    };

    statusFilter(item){
        this.selected = item;
        // this.filterByStatus();
    };

    deleteService(x){
        this.showPopUp = true;
        this.success = false;
    };

    hideDeletePopup(x){
        if(this.success){
            this.router.navigateByUrl('services');
        }
        this.showPopUp = false;
        this.success = false;
    };

    deleteServiceConfirm(){
        this.success = true;
    };

    setMessage(body, type) {
        this.message.body = body;
        this.message.type = type;
        this.sharedService.sharedMessage = this.message;
    };


    goToServices(){
         console.log("welocome to delete section"+ this.serviceData.service.name+"and"+this.serviceData.service.domain);
        var payload = {
                "service_name": this.serviceData.service.name,
                "domain": this.serviceData.service.domain,
                "id" : this.serviceData.service.id
                // "version": "LATEST"
            };
       this.deleteServiceStatus.emit(this.deleteServiceVal);
       this.http.post('/platform/delete-serverless-service' , payload)
       .subscribe(
        (Response) => {
            this.serviceRequestSuccess = true;
            this.serviceRequestFailure = false;
            this.toasterService.pop('success', this.serviceData.service.name +" "+'delete has been initiated successfully!!');
       },
        (error) => {
            this.serviceRequestSuccess = false;
            this.serviceRequestFailure = true;
            this.toasterService.pop('error', 'Delete service can not be reached');
        }
        );
      
       this.router.navigateByUrl('services');
    //    var msg = this.serviceData.service.name +" has been successfully created"
    //    this.setMessage("success",msg);

    };
    

    onServiceNameChange(){
        if(this.ServiceName == this.service['name']){
            this.disblebtn = false;
        }
        else{
            this.disblebtn = true;
        }
    }

    changeTabIndex(index){
        this.thisIndex = index;
    }

    handleTabs(index){
        this.selectedTab = index;
    }


    ngOnInit(
    ) {
        // this.service = this.serviceData.service;
        this. breadcrumbs = [{
            'name' : 'Service',
            'link' : 'services'
        },
        {
            'name' : this.service['name'],
            'link' : ''
        }]

        this.sub = this.route.params.subscribe(params => {
            this.id = params['id'];

            this.fetchService(this.id);
        });
    }

}
