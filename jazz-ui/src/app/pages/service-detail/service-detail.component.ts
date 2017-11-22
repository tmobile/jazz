/**
  * @type Component
  * @desc Service detail page
  * @author
*/
import { Http, Headers, Response } from '@angular/http';
import { Component, OnInit , Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from "../../SharedService.service";
// import { RequestService, DataCacheService } from "../../core/services";
import { ToasterService} from 'angular2-toaster';
import { BarGraphComponent} from '../../secondary-components/bar-graph/bar-graph.component';
import { RequestService, DataCacheService, MessageService, AuthenticationService } from '../../core/services/index';
@Component({
    selector: 'service-detail',
    templateUrl: './service-detail.component.html',
    styleUrls: ['./service-detail.component.scss'],
    providers: [RequestService, MessageService]
})

export class ServiceDetailComponent implements OnInit {


    constructor(
        private toasterService: ToasterService,
        private route: ActivatedRoute,
        private router: Router,
        private sharedService: SharedService,
        private http: RequestService,
        private messageservice:MessageService,
        private cache: DataCacheService,
        private authenticationservice:AuthenticationService
    ) {
        this.message = this.sharedService.sharedMessage;
        this.toastmessage = messageservice;
    }
    message;

    @Output() deleteServiceStatus:EventEmitter<boolean> = new EventEmitter<boolean>();

    disblebtn:boolean = true;
    ServiceName:string;
    deleteServiceVal:boolean;
    id: string;

    isLoadingService: boolean = false;
    isLoading: boolean = false;
    selectedTab = 0;
    selected:string = 'All';
    service: any = {};
    stageOverview: any = {};
    showPopUp:boolean = false;
    success:boolean = false;
    thisIndex : number = 0;
    serviceRequestFailure:boolean = false;
    serviceRequestSuccess:boolean = false;

    private sub: any;
    private subscription:any;
    private toastmessage:any;

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
                description : 'Sample Description',
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
                status: service.status.replace('_',' '),
                description: service.description,
                approvers: service.approvers,
                domain: service.domain,
                email: service.email,
                slackChannel: service.slack_channel,
                repository: service.repository,
                tags: service.tags,
                endpoints:service.endpoints
            };
        }
    };

    onDataFetched(service) {

      if (service !== undefined && service !== "") {
        this.service = this.processService(service);

        // Update breadcrumbs
        this.breadcrumbs = [
        {
            'name' : this.service['name'],
            'link' : ''
        }]
        this.isLoadingService = false;
      } else{
        this.isLoadingService = false;
        let errorMessage = this.toastmessage.successMessage(service,"serviceDetail");
        this.toast_pop('error', 'Oops!', errorMessage)
      }
    }

    fetchService(id: string){

        this.isLoadingService = true;

        let cachedData = this.cache.get(id);

        if (cachedData) {
            this.onDataFetched(cachedData)
             if(this.service.serviceType == "website")
            {
                this.tabData = ['OVERVIEW', 'ACCESS CONTROL', 'COST', 'METRICS'];
            }
        } else{
            this.http.get('/platform/services/'+id).subscribe(
              response => {
                    let service = response.data;
                     if(response.data.type === "website")
                    {
                         this.tabData = ['OVERVIEW', 'ACCESS CONTROL', 'COST', 'METRICS'];
                    }
                    this.cache.set(id, service);
                    this.onDataFetched(service);
                },
                err => {
                    this.isLoadingService = false;
                    let errorMessage = this.toastmessage.errorMessage(err,"serviceDetail");
                    this.toast_pop('error', 'Oops!', errorMessage)
                }
            )
        }

    };



    onSelectedDr(selected){
         if(selected == 3 || selected == 2 || selected == 1)
            return;
        else
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
        if (!this.service.status || this.service.status == 'deletion_completed' || this.service.status == 'deletion_started') {
            return;
        }
        this.showPopUp = true;
        this.success = false;
    };

    hideDeletePopup(x){
        if(this.success){
            this.router.navigateByUrl('services');
        }
        this.showPopUp = false;
        this.success = false;
        if(this.subscription){
            this.subscription.unsubscribe();

        }
    };

    deleteServiceConfirm(){
        this.success = true;
    };

    setMessage(body, type) {
        this.message.body = body;
        this.message.type = type;
        this.sharedService.sharedMessage = this.message;
    };


    deleteServiveInit(){

        this.isLoading=true;
        this.disblebtn =true;
        var payload = {
                "service_name": this.service.name,
                "domain": this.service.domain,
                "id" : this.service.id
                // "version": "LATEST"
            };
       this.deleteServiceStatus.emit(this.deleteServiceVal);
       this.subscription = this.http.post('/platform/delete-serverless-service' , payload)
       .subscribe(
        (Response) => {
            var update = {
                "status":"Deleting"
            }
            this.serviceRequestSuccess = true;
            this.serviceRequestFailure = false;
            let successMessage = this.toastmessage.successMessage(Response,"serviceDelete")
            this.toast_pop('success',"", "Service: "+this.service.name +" "+successMessage);
            this.isLoading = false;

            this.cache.set('deletedServiceId',this.service.id)
            this.cache.set("updateServiceList", true);
            this.http.put('/platform/services/'+this.service.id , update)
            .subscribe(
                (Response)=>{
                    this.isLoading=false;
                    this.showPopUp=false;
                    setTimeout(() => {
                      this.router.navigateByUrl('services');
                    }, 3000);

                },
                (Error)=>{
                    this.isLoading=false;
                    this.showPopUp=false;
                    setTimeout(() => {
                      this.router.navigateByUrl('services');
                    }, 3000);
                }
            )
        },
        (error) => {
            this.serviceRequestSuccess = false;
            this.serviceRequestFailure = true;
            let errorMessage = this.toastmessage.errorMessage(error,"serviceDelete");
            this.toast_pop('error','Oops!', errorMessage);
            this.isLoading = false;
        }
        );


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
        this.breadcrumbs = [
        {
            'name' : this.service['name'],
            'link' : ''
        }]
        this.sub = this.route.params.subscribe(params => {
            this.id = params['id'];
            this.fetchService(this.id);
        });
    }
    ngOnChange(){

  }

}
