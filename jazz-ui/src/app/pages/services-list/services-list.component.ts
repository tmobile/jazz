/**
  * @type Component
  * @desc service list Page
  * @author
*/

import { Component, OnInit, EventEmitter, Output} from '@angular/core';
import { ToasterService} from 'angular2-toaster';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
import { SharedService } from "../../SharedService.service";
import { RequestService, DataCacheService, MessageService ,AuthenticationService} from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

declare var $:any;

@Component({
  selector: 'services-list',
  templateUrl: './services-list.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./services-list.component.scss']
})

export class ServicesListComponent implements OnInit {
  private toastMessage:any;
  private subscription:any;
  errBody: any;
	parsedErrBody: any;
  errMessage: any;
  selectedList:string='all';

  constructor(private sharedService: SharedService,
            private router: Router,
            private request: RequestService,
            private toasterService: ToasterService,
            private cache: DataCacheService,
            private messageservice: MessageService,
            private authenticationservice:AuthenticationService) {
    this.message = this.sharedService.sharedMessage;
    this.toasterService = toasterService;
    this.toastMessage =messageservice;

    this.http = request;
  }

  popToast(type, title, message) {
      this.toasterService.pop(type, title, message);
  }
    private intervalSubscription: Subscription;
  private http: any;
  updateList: boolean=false;
  serviceListEmpty: boolean=false;
  updateinterval = 30000;

  deletedServiceId: string;
  selectedTab = 0;
  showAddService: boolean = false;
  selected:string = "Status (All)";
  thisIndex: number = 0;
  serviceList = [];

  tableHeader2 = [
    {
      label: 'Name',
      key: 'name',
      sort: true,
      filter: {
        type: 'input'
      }
    },{
      label: 'Type',
      key: 'type',
      sort: true,
      filter: {
        type: ''
      }
    },{
      label: 'Namespace',
      key: 'domain',
      sort: true,
      filter: {
        type: 'input'
      }
    },{
      label: 'Last modified',
      key: 'lastModified',
      sort: true,
      filter: {
        type: 'dateRange'
      }
    },{
      label: 'Status',
      key: 'status',
      sort: true,
      filter: {
        type: 'dropdown',
        data: ["creation started","creation failed","creation completed","deletion started","deletion failed","deletion completed","active","inactive"]
      }
    }
  ]

  tableHeader = [{"name" : "Name","field" : "name","FilterType":"input"},
  {"name" : "Type","field" : "type","FilterType":"none"},
  {"name" : "Domain","field" : "domain","FilterType":"input"},
  {"name" : "Last modified","field" : "lastModified","FilterType":"date"},
  {"name" : "Health","field" : "health","FilterType":"none"},
  {"name" : "Status","field" : "status","FilterType":"dropdown"}];

  //'Name','Type','Domain','Last modified','health','status'
  statusData = ['Status (All)','Status (Active)','Status (Pending)','Status (Stopped)'];
  tabData = ['all','api','function','website'];

  recentActivities = [
    {
      title : 'Production deployment',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-deployment@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Merge to Master',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-merge@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'ALERT: Deployment Failed',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-alert@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Production deployment',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-deployment@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Pending Approval',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-pendingapproval@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Pending Approval',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-pendingapproval@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Pending Approval',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-pendingapproval@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Pending Approval',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-pendingapproval@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Pending Approval',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-pendingapproval@3x.png',
      time: '10-10-17, 11:59:59 PST'
    },
    {
      title : 'Pending Approval',
      details : 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium',
      path: '../assets/images/icons/icon-pendingapproval@3x.png',
      time: '10-10-17, 11:59:59 PST'
    }
  ];

  filterSelected: Boolean = false;
  paginationSelected: Boolean = true;
  pageSelected: number = 1;
  totalPagesTable: number = 7;
  searchActive: Boolean = false;
  searchbar: any;
  errorMsg: string = '';
  filter:any;
  sort:any;
  loadingState: string = '';
  selectedListData:any;
  prevActivePage: number = 0;
  message;
  relativeUrl : string = '/jazz/services';
  limitValue : number = 10;
  tableEmptyMessage: string = '';


  processServiceList(serviceList){
    if (serviceList === undefined || serviceList.length === undefined) {
      return [];
    }
    let _serviceList = [];
    serviceList.forEach(function _processService(service) {
      let serviceRow = {
        name: service.service,
        type: service.type,
        domain: service.domain,
        health: 2,
        status: service.status.replace('_',' '),
        lastModified: service.timestamp.split("T")[0],
        link: 'services/' + service.id,
        id: service.id,
        data: service
      };
      _serviceList.push(serviceRow);
    });

    return _serviceList;
  };
  serviceCall(){
    this.serviceList = [];
    this.loadingState = 'loading';
    if(this.relativeUrl.indexOf('status=') == -1)
    {
      this.addQueryParam("status=", "creation_started,creation_failed,creation_completed,deletion_started,deletion_failed,active",  true);
      return;
    }
    if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.http.get(this.relativeUrl).subscribe(
      response => {
          let services = response.data.services;
          if(!services){
            services = response.data;
          }
          if (services !== undefined && services !== "" && services.length !== undefined) {
            if (services.length == 0) {
              this.serviceListEmpty = true;
              this.totalPagesTable = 0;
              this.loadingState = 'empty';
            } else{
              this.serviceListEmpty = false;
              var pageCount = response.data.count;
              if(pageCount){
                this.totalPagesTable = Math.ceil(pageCount/this.limitValue);
              }
              else{
                this.totalPagesTable = 0;
              }
              this.serviceList = this.processServiceList(services);
              this.backupdata = this.serviceList;
              this.loadingState = 'default';
            }

          } else{
            this.loadingState = 'error';
          }
        },
        err => {
            this.loadingState = 'error';
            this.errBody = err._body;
            this.errMessage = 'OOPS! something went wrong while fetching data';
            try {
              this.parsedErrBody = (this.errBody);
              if(this.parsedErrBody.message != undefined && this.parsedErrBody.message !== '' ) {
                this.errMessage = this.parsedErrBody.message;
              }
              } catch(e) {
                console.log('JSON Parse Error', e);
              }
        }
    );
  }
  fetchServices(){
    this.serviceCall();
  };
  onRowClicked (rowData){
      if (rowData != undefined) {
        this.cache.set(rowData.id, rowData.data);
          if (rowData.link != undefined) {
              this.router.navigateByUrl(rowData.link);
          }
      }
  }
  setMessage(body, type) {
    this.message.body = body;
    this.message.type = type;
    this.sharedService.sharedMessage = this.message;
  }
  formStringFrmObj(array){
    var string= "";
    array.forEach(function(param) {
      if(param.value != undefined && param.value.toString() != ""){
        string = string + param.key + "=" + param.value + "&"
      }
    });
    return string;
  }
  replaceIfKeyExists(array, newkey, newvalue){
    array.forEach(function(param) {
      if((param.key + "=") == newkey){
        param.value = newvalue;
      }
    });
    return array;
  }
  formKeyValuePairFrmUrl(){
    var queryParameters = this.relativeUrl.split("?")[1];
    var eachParam = queryParameters.split("&");
    var array = [];

    eachParam.forEach(function(param) {
      var key = param.split("=")[0];
      var val = param.split("=")[1];
      if(key != ""){ // to add key only if has value
        array.push({"key":key, "value":val});
      }
      if(val == undefined || val.toString() == ""){
        var index = array.indexOf(param);
        if(index > -1){
          array.splice(array.indexOf(param),1); // to remove the key if value is empty
        }
      }
    });
    return array;
  }
  addQueryParam(queryParamKey, queryParamValue, makeCall){
    if( this.relativeUrl.indexOf('?') == -1 ){
        this.relativeUrl += '?';
      }

      if( this.relativeUrl.indexOf(queryParamKey ) == -1 && queryParamValue.toString() != '' && queryParamValue.toString().length > 0  ){
        this.relativeUrl += queryParamKey + queryParamValue + '&';
        // this.serviceCall();
      }
      else{

        var array = this.formKeyValuePairFrmUrl();
        var arrayWithNewValues = this.replaceIfKeyExists(array, queryParamKey, queryParamValue);
        var newrelateUrl = this.formStringFrmObj(arrayWithNewValues);
        this.relativeUrl = this.relativeUrl.split("?")[0] + "?" + newrelateUrl;

      }

      if(makeCall){
        this.serviceCall();
      }
  }
  onFilter(event){
    this.serviceList = this.backupdata;

    for (var i = 0; i < this.tableHeader2.length; i++) {
      var col = this.tableHeader2[i];
      if (col.filter['type'] === 'dropdown' && col.filter['_value'] != undefined){
        var colFilterVal = col.filter['_value'].toLowerCase().replace(' ','_');
      }
      else if (col.filter['type'] === 'input'){
        var colFilterVal = col.filter['value'] ;
      }

      if (col.filter != undefined && colFilterVal != undefined) {
        // adding ?
        if( this.relativeUrl.indexOf('?') == -1 ){
          this.relativeUrl += '?';
        }

        if (col.filter['type'] == 'dateRange') {
          // code...


        } else if( col.filter['type'] == 'dropdown' || (event.filter['type'] === 'input' && (event.keyCode === 13)) ){
          var queryParamKey = 'offset=';
          var offsetValue = 0;
          var queryParamValue = offsetValue;
          $(".pagination.justify-content-center li:nth-child(2)")[0].click();
          this.addQueryParam(queryParamKey, queryParamValue, false );

          if(event.key == col.key){
            queryParamKey = col.key + '=';
            if(queryParamKey == "name="){
              queryParamKey = "service=";
            }
            else if(queryParamKey == "lastModified="){
              queryParamKey = "timestamp=";
            }
            queryParamValue = colFilterVal;
            this.addQueryParam(queryParamKey, queryParamValue, true );
          }

        }
      }
    }
  };
  onFilterSelected(selectedList){
    this.selectedListData = selectedList;
    var queryParamKey = 'offset=';
    var offsetValue = 0;
    $(".pagination.justify-content-center li:nth-child(2)")[0].click();
    this.addQueryParam(queryParamKey, offsetValue, false );

    queryParamKey = 'type=';
    var queryParamValue = this.selectedListData[0];
    if(queryParamValue == "all"){
      queryParamValue = "";
    }
    this.addQueryParam(queryParamKey, queryParamValue,  true);
  }
  statusFilter(item){
    this.selected = item;
  }
  onSort(sortData){

    var col = sortData.key;
    var reverse = false;
    var sort_dir = "desc";
    if (sortData.reverse == true) {
      reverse = true;
      sort_dir = "asc";
    }
    var queryParamKey = 'sort_by=';
    var queryParamValue = col;
    if(queryParamValue == "name"){
      queryParamValue = "service";
    }
    else if(queryParamValue == "lastModified"){
      queryParamValue = "timestamp";
    }
    this.addQueryParam(queryParamKey, queryParamValue,  false);
    queryParamKey = 'sort_direction=';
    queryParamValue = sort_dir;
    this.addQueryParam(queryParamKey, queryParamValue,  true)
  };
  paginatePage(currentlyActivePage){
    if(this.prevActivePage != currentlyActivePage){
      this.prevActivePage = currentlyActivePage;
      this.pageSelected = currentlyActivePage;
      this.serviceList = [];
      this.backupdata = [];
      this.fetchServices();  /** call fetch services*/

      var queryParamKey = 'limit=';
      var queryParamValue = this.limitValue;
      this.addQueryParam(queryParamKey, queryParamValue, false );


      var queryParamKey = 'offset=';
      var offsetValue = (this.limitValue * (currentlyActivePage-1));
      var queryParamValue = offsetValue;
      this.addQueryParam(queryParamKey, queryParamValue, true );
      /*
      * Required:- we need the total number of records from the api, which will be equal to totalPagesTable.
      * We should be able to pass start number, size/number of records on each page to the api, where,
      * start = (size * currentlyActivePage) + 1
      */
    }
    else{
    }
  }
  onServiceSearch(searchbar){
      this.searchbar = searchbar;
      if(searchbar.keyCode == 13){
        var queryParamKey = 'offset=';
        $(".pagination.justify-content-center li:nth-child(2)")[0].click();
        var offsetValue = 0;
        var queryParamValue = offsetValue;
        this.addQueryParam(queryParamKey, queryParamValue, false );
        queryParamKey = 'filter=';
        queryParamValue = searchbar.searchString;
        this.addQueryParam(queryParamKey, queryParamValue,  true);
      }
  };
  tabChanged (i){
    this.selectedTab = i;
  };
  showService(isShow){
    this.showAddService = isShow;
    if(!isShow){
      this.updateList = this.cache.get("updateServiceList");
      this.updateServices(this.updateList);
    } else{
      if(this.updateList){
        this.intervalSubscription.unsubscribe();
      }
    }
  }
  deleteService(){
    this.serviceList = this.serviceList.filter(element => {
        return element.status != "Deleting";
    });
  }
  paginationInit(){
      if( this.relativeUrl.indexOf('?') == -1 ){
        this.relativeUrl += '?';
      }

      var queryParamKey = 'limit=';

      var queryParamValue = this.limitValue;
      this.relativeUrl += queryParamKey + queryParamValue + '&';

      queryParamKey = 'offset=';
      var currentlyActivePage = 1;
      var offsetValue = (this.limitValue * (currentlyActivePage - 1) );
      queryParamValue = offsetValue;
      this.relativeUrl += queryParamKey + queryParamValue + '&';
      this.serviceCall();
  }
  backupdata = [];
  ngOnInit() {
    this.backupdata = this.serviceList;
  	this.filter = new Filter(this.serviceList);
    this.sort = new Sort(this.serviceList);
    setTimeout(() => {
      this.closeDetelePopup();
    }, 3000);

    this.deletedServiceId = this.cache.get('deletedServiceId');
     this.fetchServices();
     this.paginatePage(1);
     this.relativeUrl = '/jazz/services?limit=' + this.limitValue + '&offset=' + 0 +'&';
     this.serviceCall();
    this.paginationInit();
    this.updateList = this.cache.get("updateServiceList");
    this.updateServices(this.updateList);
  }
  refreshData(event){
		this.loadingState = 'default';
		this.serviceCall();
	}
  updateServices(isTrue){

    if(isTrue){

      this.intervalSubscription = Observable.interval(this.updateinterval)
      .switchMap((response) => this.http.get(this.relativeUrl))
      .subscribe(response => {
        let dataResponse = <any>{};
        dataResponse.list = response;
        let services = dataResponse.list.data.services;
        if(!services){
          services = dataResponse.list.data;
        }
        var pageCount = dataResponse.list.data.count;
        if(pageCount){
          this.totalPagesTable = Math.ceil(pageCount/this.limitValue);
        }
        else{
          this.totalPagesTable = 0;
        }
          if (services !== undefined && services !== "" && services.length !== undefined) {
            this.serviceList = this.processServiceList(services);
            this.backupdata = this.processServiceList(services);
            this.loadingState = 'default';
          }
      });

    }
  }
  closeDetelePopup(){
    this.setMessage("hide popup","no msg");
  }
  ngOnDestroy() {
    if(this.updateList){
      this.intervalSubscription.unsubscribe();
    }
  }
}