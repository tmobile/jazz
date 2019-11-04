/**
 * @type Component
 * @desc Service detail page
 * @author
 */
import { Http, Headers, Response } from '@angular/http';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from "../../SharedService.service";
import { AfterViewInit, ViewChild } from '@angular/core';

import { ToasterService } from 'angular2-toaster';
import { BarGraphComponent } from '../../secondary-components/bar-graph/bar-graph.component';
import { RequestService, DataCacheService, MessageService, AuthenticationService } from '../../core/services/index';
import { ServiceMetricsComponent } from '../service-metrics/service-metrics.component';
import { environment as env_oss } from './../../../environments/environment.oss';


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
    private messageservice: MessageService,
    private cache: DataCacheService,
    private authenticationservice: AuthenticationService
  ) {
    this.message = this.sharedService.sharedMessage;
    this.toastmessage = messageservice;
  }

  message;

  @Output() deleteServiceStatus: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('selectedTabComponent') selectedTabComponent;
  isEnvAvailable: boolean = false;
  disblebtn: boolean = true;
  ServiceName: string;
  platfrom: string;
  deleteServiceVal: boolean;
  id: string;
  errMessage: string = '';
  isLoadingService: boolean = false;
  isLoading: boolean = false;
  selectedTab = 'overview';
  selected: string = 'All';
  service: any = {};
  isGraphLoading: boolean = false;
  stageOverview: any = {};
  provider: any;
  showPopUp: boolean = false;
  success: boolean = false;
  thisIndex: number = 0;
  err_flag: boolean = false;
  serviceDeleted: boolean = false;
  serviceDeleteFailed: boolean = false;
  serviceRequestFailure: boolean = false;
  serviceRequestSuccess: boolean = false;
  canDelete: boolean = true;
  successMessage: string = "";
  errorMessage: string = "";
  test: any = "delete testing";
  disabled_tab: boolean = false;
  refreshTabClicked: boolean = false;
  isAdminAccess: boolean = false;
  currentUser: any = {}
  isError403: boolean = false;


  private sub: any;
  private subscription: any;
  private toastmessage: any;

  statusData = ['All', 'Active', 'Pending', 'Stopped'];
  tabData = ['overview', 'access control', 'metrics', 'cost', 'logs'];

  breadcrumbs = []


  opnSidebar(event) {
    this.closeSidebar(true);
  }

  public closeSidebar(eve) {
    this.closed = true;
    this.close = eve;
  }

  close: boolean = false;
  closed: boolean = false;

  processService(service) {
    if (service === undefined) {
      return {};
    } else {
      service.metadata = this.addEventSource(service.metadata);
      let returnObject = {
        id: service.id,
        name: service.service,
        runtime: service.runtime,
        status: service.status.replace('_', ' '),
        description: service.description || '',
        approvers: service.approvers,
        domain: service.domain,
        email: service.email,
        slackChannel: service.slack_channel,
        repository: service.repository,
        tags: service.tags,
        endpoints: service.endpoints,
        deployment_targets :  service.deployment_targets[service.type].S || service.deployment_targets[service.type],
        is_public_endpoint: service.is_public_endpoint,
        created_by: service.created_by,
        accountID: service.deployment_accounts[0].accountId,
        region: service.deployment_accounts[0].region,
        provider: service.deployment_accounts[0].provider
      }
      if(service.type === 'sls-app'){
        service.type = 'custom'
      }
      returnObject['serviceType'] = service.type
      if (service.metadata) {
        returnObject["create_cloudfront_url"] = service.metadata.create_cloudfront_url;
        returnObject["eventScheduleRate"] = service.metadata.eventScheduleRate;
        returnObject["eventScheduleEnable"] = service.metadata.eventScheduleEnable;
        if(service.metadata.event_source){
          returnObject["event_source"] = service.metadata.event_source;
        }
        if(service.metadata.event_source_dynamodb){
          returnObject["event_source_arn"] = service.metadata.event_source_dynamodb;
        }
        if(service.metadata.event_source_kinesis){
          returnObject["event_source_arn"] = service.metadata.event_source_kinesis;
        }
        if(service.metadata.event_source_s3){
          returnObject["event_source_arn"] = service.metadata.event_source_s3;
        }
        if(service.metadata.event_source_sqs){
          returnObject["event_source_arn"] = service.metadata.event_source_sqs;
        }
        if(service.metadata.event_source_cosmosdb){
          returnObject["event_source_arn"] = service.metadata.event_source_cosmosdb;
        }
        if(service.metadata.event_source_eventhub){
          returnObject["event_source_arn"] = service.metadata.event_source_eventhub;
        }
        if(service.metadata.event_source_storageaccount){
          returnObject["event_source_arn"] = service.metadata.event_source_storageaccount;
        }
        if(service.metadata.event_source_servicebusqueue){
          returnObject["event_source_arn"] = service.metadata.event_source_servicebusqueue;
        }
      }
      if(typeof returnObject["event_source_arn"] == "object"){
        returnObject["event_source_arn"] = returnObject["event_source_arn"].S;
      }
      return returnObject;

    }
  };

  addEventSource(obj){
    let keysList = Object.keys(obj);
    for(let i =0; i < keysList.length ; i++){
      if(keysList[i].includes("event_source_")) {
        obj.event_source = keysList[i].replace("event_source_","");
      }
    }
    return obj;
  }
  onDataFetched(service) {

    if (service !== undefined && service !== "") {
      if (!service.id && service.data) {
        service = service.data;
      }

      this.service = this.processService(service);
      // Update breadcrumbs
      this.breadcrumbs = [
        {
          'name': this.service['name'],
          'link': ''
        }]
      this.isLoadingService = false;
      if (service.status == 'deletion_completed' || service.status == 'deletion_started' || service.status == 'creation_started' || service.status == 'creation_failed' || (!service.repository && service.domain == 'jazz'))
        this.canDelete = false;

    } else {
      this.isLoadingService = false;
      let errorMessage = this.toastmessage.successMessage(service, "serviceDetail");
      this.toast_pop('error', 'Oops!', errorMessage)
    }
  }

  setTabs() {
    let serviceType = this.service.type || this.service.serviceType;
    switch (serviceType) {
      case 'api':
        this.tabData = ['overview', 'access control', 'metrics', 'logs', 'cost'];
        break;
      case 'website':
        this.tabData = ['overview', 'access control', 'metrics', 'cost'];
        break;
      case 'function':
        this.tabData = ['overview', 'access control', 'metrics', 'logs', 'cost'];
        break;
    }
  }

  fetchService(id) {
    this.isLoadingService = true;
    this.http.get('/jazz/services/' + id, null, id).subscribe(response => {
      let service = response.data;
      this.isEnvAvailable = true;
      this.provider = response.data.deployment_accounts[0].provider
      this.cache.set(id, service);
      this.onDataFetched(service);
      this.isGraphLoading = false;
      this.selectedTabComponent.refresh_env();
      this.setTabs();
      if(service && service.policies && service.policies.length) {
        service.policies.forEach(policy => {
          if (policy.category === "manage" && policy.permission === "admin") {
            this.setAdminAccess(true);
          }
        });
      }
    }, (err) => {
      console.log("error here: ", err);
      if (err.status === 404) {
        this.router.navigateByUrl('404');
      } else if (err.status === 403) {
        this.isError403 = true;
      }
      this.isLoadingService = false;
      let errorMessage = 'OOPS! something went wrong while fetching data';
      this.isGraphLoading = false;
      errorMessage = this.toastmessage.errorMessage(err, "serviceDetail");
      this.errMessage = errorMessage;
      this.err_flag = true;
    }
    )


  };


  onSelectedDr(selected) {
    this.selectedTab = selected;
  }

  tabChanged(i) {
    this.selectedTab = i;
    if (i == 4) {
      this.disabled_tab = true;
    }
  };

  statusFilter(item) {
    this.selected = item;
    // this.filterByStatus();
  };

  env(event) {
    if (!this.service.repository && this.service.domain == 'jazz') {
      this.canDelete = false;
    } else if ((event != 'creation failed') && (event != 'creation started') && (event != 'deletion started') && (event != 'deletion completed')) {
      this.canDelete = true;
    } else {
      this.canDelete = false;
    }
  }

  public goToAbout(hash) {
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag', true);
    this.cache.set('scroll_id', hash);
  }

  deleteService(x) {
    if (!this.service.status || this.service.status == 'deletion_completed' || this.service.status == 'deletion_started') {
      return;
    }
    this.showPopUp = true;
    this.success = false;
  };

  refreshServ() {
    this.isGraphLoading = true;
    this.fetchService(this.id);
  }

  hideDeletePopup(x) {
    if (this.success) {
      this.router.navigateByUrl('services');
    }
    this.showPopUp = false;
    this.success = false;
    if (this.subscription) {
      this.subscription.unsubscribe();

    }
  };

  deleteServiceConfirm() {
    this.success = true;
  };

  setMessage(body, type) {
    this.message.body = body;
    this.message.type = type;
    this.sharedService.sharedMessage = this.message;
  };

  refreshCostData(event) {
    this.isLoading = true;
    this.deleteServiceInit()
  }

  refreshTab() {
    this.refreshTabClicked = true;
    if (this.selectedTab == 'overview') {
      this.refreshServ();
    }
    else {
      this.selectedTabComponent.refresh();
    }

  }

  deleteServiceInit() {

    this.isLoading = true;
    this.disblebtn = true;
    var payload = {
      "service_name": this.service.name,
      "domain": this.service.domain,
      "id": this.service.id
    };
    this.deleteServiceStatus.emit(this.deleteServiceVal);
    this.subscription = this.http.post('/jazz/delete-serverless-service', payload, this.service.id)
      .subscribe(
        (Response) => {
          var update = {
            "status": "Deleting"
          }
          var service = payload.service_name;
          var domain = payload.domain;
          var reqId = Response.data.request_id;
          localStorage.setItem('request_id' + "_" + payload.service_name + "_" + payload.domain, JSON.stringify({
            service: service,
            domain: domain,
            request_id: reqId
          }));
          this.serviceRequestSuccess = true;
          this.serviceRequestFailure = false;
          let successMessage = this.toastmessage.successMessage(Response, "serviceDelete")
          this.successMessage = successMessage;
          this.success = true;
          this.serviceDeleted = true;
          // this.toast_pop('success',"", "Service: "+this.service.name +" "+successMessage);
          this.isLoading = false;
          // this.cache.set('request_id',this.test);
          this.cache.set('deletedServiceId', this.service.id)
          this.cache.set("updateServiceList", true);
          this.serviceDeleteFailed = false;

        },
        (error) => {
          this.serviceRequestSuccess = false;
          this.serviceRequestFailure = true;
          let errorMessage = this.toastmessage.errorMessage(error, "serviceDelete");
          this.errorMessage = errorMessage;
          this.success = true;
          this.serviceDeleteFailed = true;
          // this.toast_pop('error','Oops!', errorMessage);
          this.isLoading = false;
          this.serviceDeleted = false;
        }
      );


  };

  backtoservice() {
    this.router.navigateByUrl('services');
  }

  backtoserviceid() {
    this.showPopUp = false;
    if (this.serviceDeleted == true) {
      this.serviceDeleted = false;
    } else if (this.serviceDeleteFailed == true) {
      this.serviceDeleteFailed = false;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }


  onServiceNameChange() {

    if (this.ServiceName.toLowerCase() == this.service['name']) {
      this.disblebtn = false;
    }
    else {
      this.disblebtn = true;
    }
  }


  changeTabIndex(index) {
    this.thisIndex = index;
  }

  handleTabs(index) {
    this.selectedTab = index;

  }

  toast_pop(error, oops, errorMessage) {
    var tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toasterService.pop(error, oops, errorMessage);
    setTimeout(() => {
      tst.classList.remove('toaster-anim');
    }, 3000);
  }

  setAdminAccess(access) {
    this.isAdminAccess = access;
  }

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.breadcrumbs = [
      {
        'name': this.service['name'],
        'link': ''
      }]
    this.sub = this.route.params.subscribe(params => {
      this.id = params['id'];
      this.fetchService(this.id);
    });

  }

  ngOnChanges(x: any) {
  }
}
