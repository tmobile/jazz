/**
  * @type Component
  * @desc service list Page
  * @author
*/

import { Component, OnInit, EventEmitter, Output, ViewChild } from '@angular/core';
import { ToasterService} from 'angular2-toaster';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
import { SharedService } from "../../SharedService.service";
import { RequestService, DataCacheService, MessageService ,AuthenticationService } from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { FilterTagsServicesComponent } from '../../secondary-components/filter-tags-services/filter-tags-services.component';
import { TableTemplateComponent } from '../../secondary-components/table-template/table-template.component';
import { SearchBoxComponent } from './../../primary-components/search-box/search-box.component';

declare var $:any;

@Component({
  selector: 'services-list',
  templateUrl: './services-list.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./services-list.component.scss']
})

export class ServicesListComponent implements OnInit {

@ViewChild('filtertags') FilterTags: FilterTagsServicesComponent;
@ViewChild('tabletemplate') tableTemplate:TableTemplateComponent;
@ViewChild('searchbox') searchBox:SearchBoxComponent;
  private toastMessage:any;
  private subscription:any;
  errBody: any;
  errCode: number;
  parsedErrBody: any;
  errMessage: any;
  selectedList:string='all';
  fromService: boolean;
  // @Output() onClose:EventEmitter<boolean> = new EventEmitter<boolean>();

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

private intervalSubscription: Subscription;
  private http: any;
  updateList: boolean=false;
  serviceListEmpty: boolean=false;
  updateinterval = 30000;
  serviceCount: number = 0;
  isSort: boolean = true;
  deletedServiceId: string;
  selectedTab = 0;
  showAddService: boolean = false;
  selected:string = "Status (All)";
  thisIndex: number = 0;
  // breadcrumbs = [{
  //   'name' : 'Services',
  //   'link' : 'services'
  // }]
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
    },
    {
      label: 'Platform',
      key: 'platform',
      sort: true,
      filter: {
        type: 'input'
      }
    },
    {
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
    // },{
    //   label: 'Health',
    //   key: 'health',
    //   sort: true,
    //   filter: {
    //     type: ''
    //   }
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
  {"name" : "Namespace","field" : "domain","FilterType":"input"},
  {"name" : "Last modified","field" : "lastModified","FilterType":"date"},
  {"name" : "Health","field" : "health","FilterType":"none"},
  {"name" : "Status","field" : "status","FilterType":"dropdown"}];

  //'Name','Type','Namespace','Last modified','health','status'
  statusData = ['Status (All)','Status (Active)','Status (Pending)','Status (Stopped)'];
  tabData = ['all','api','function','website','custom'];

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
  relativeUrl : string = '/jazz/services/search';
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
        type: service.type === 'sls-app' ? 'custom' : service.type,
        domain: service.domain,
        platform: service.deployment_accounts[0].provider,
        health: 2,
        status: service.status.replace('_',' '),
        lastModified: service.timestamp.split("T")[0],
        link: 'services/' + service.id,
        id: service.id,
        data: service
      };
      if(service.type == 'sls-app'){
        service.type = 'custom'
      }
      serviceRow['type'] = service.type
      _serviceList.push(serviceRow);
    });

    return _serviceList;
  };
  serviceCall(){
    this.serviceList = [];
    this.loadingState = 'loading';
    if(this.relativeUrl.indexOf('status=') == -1)
    {
      this.addQueryParam("status=", "creation_started,creation_failed,creation_completed,deletion_started,deletion_failed,active,inactive",  true);
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
             // this.tableEmptyMessage = this.toastMessage.successMessage(response,"serviceList");
              this.totalPagesTable = 0;
              this.loadingState = 'empty';
            } else{
              this.serviceListEmpty = false;
              var pageCount = response.data.count;
              this.serviceCount = pageCount;
              if(pageCount){
                this.totalPagesTable = Math.ceil(pageCount/this.limitValue);
                if(this.totalPagesTable === 1){
                  this.paginationSelected = false;
                }
              }
              else{
                this.totalPagesTable = 0;
              }
              this.serviceList = this.processServiceList(services);
              this.backupdata = this.serviceList;
              setTimeout(() => this.toasterService.clear(), 10000);
              this.loadingState = 'default';
            }

          } else{
            this.loadingState = 'error';
          }
        },
        err => {
            this.loadingState = 'error';
            this.errBody = err._body;

            this.errMessage= this.toastMessage.errorMessage(err,"serviceList");
            try {
              this.parsedErrBody = JSON.parse(this.errBody);
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


  onFilter(event) {

    this.serviceList = this.backupdata;

    for (var i = 0; i < this.tableHeader2.length; i++) {

    var col = this.tableHeader2[i];
    if (col.filter['type'] === 'dropdown' && col.filter['_value'] != undefined) {
    var colFilterVal = col.filter['_value'].toLowerCase().replace(' ', '_');
    if (colFilterVal != undefined) {
    this.FilterTags.notifyServices(this.tableHeader2[i].key, colFilterVal);
    }
    } else if (col.filter['type'] === 'input') {
    // var colFilterVal = col.filter['value'];
    if (col.filter['value'] != undefined) {
      var colFilterVal = col.filter['value'].toLowerCase();
    }
    else {
      var colFilterVal = col.filter['value'];
    }
    if (event.keyCode == 13 && colFilterVal != undefined) {
    this.FilterTags.notifyServices(this.tableHeader2[i].key, colFilterVal);
    }
    }

    if (col.filter != undefined && colFilterVal != undefined) {
    // adding ?
    if (this.relativeUrl.indexOf('?') == -1) {
    this.relativeUrl += '?';
    }

    if (col.filter['type'] == 'dateRange') {
    // code...


    } else if ((col.filter['type'] == 'dropdown'  && (event.filter['type'] !== 'input')) || (event.filter['type'] === 'input' && (event.keyCode === 13))) {


    var queryParamKey = 'offset=';
    var offsetValue = 0;
    var queryParamValue = offsetValue;
    $(".pagination.justify-content-center li:nth-child(2)")[0].click();
    // this.pageSelected = 1;

    this.addQueryParam(queryParamKey, queryParamValue, false);

    if (event.key == col.key) {
    queryParamKey = col.key + '=';
    if (queryParamKey == "name=") {
    queryParamKey = "service=";
    } else if (queryParamKey == "lastModified=") {
    queryParamKey = "timestamp=";
    }
    queryParamValue = colFilterVal;

    this.addQueryParam(queryParamKey, queryParamValue, true);
    }

    }
    }
    }
    }

    CancelFilters(event){
switch(event){
case 'name':{
var a={
filterType:'input',
filterValue:'',
key:'name',
keyCode:13,
label:'Name'
};
// var ip=document.getElementById('inputfilter').setAttribute('ng-reflect-model','');
this.tableTemplate.resetInput('name',a);

this.onFilterCancel(a);
break;
}
case "domain":{
var a={
filterType:'input',
filterValue:'',
key:'domain',
keyCode:13,
label:'Namespace'
};
this.tableTemplate.resetInput('domain',a);

this.onFilterCancel(a);
break;
}
case "status":{
var b={
filterType:'dropdown',
filterValue:'',
key:'status',
keyCode:undefined,
label:'Status'
};
this.tableTemplate.resetInput('status',b);

this.onFilterCancel(b);
break;
}
case "search":{
var c={
keyCode:13,
searchString:""
}
this.onServiceSearch(c);
this.searchBox.clearSearchbox('');
break;
}
case "all":{
var OBJ={
filterType:'input',
filterValue:'',
key:'name',
keyCode:13,
label:'Name'
};
this.tableTemplate.resetInput('name',OBJ);
this.onFilterCancel(OBJ);
OBJ.key='domain';
OBJ.label="Namespace";
this.tableTemplate.resetInput('domain',OBJ);
this.onFilterCancel(OBJ);
OBJ.filterType='dropdown';
OBJ.filterValue='';
OBJ.key='status';
OBJ.keyCode=undefined;
OBJ.label='Status';
this.tableTemplate.resetInput('status',OBJ);
this.onFilterCancel(OBJ);
var obj={
keyCode:13,
searchString:""
}
this.onServiceSearch(obj);
break;
}
}
}



onFilterCancel(event) {

  for (var i = 0; i < this.tableHeader2.length; i++) {

  var col = this.tableHeader2[i];
  if (col.filter['type'] === 'dropdown' && col.filter['_value'] != undefined  && event.filterType !== 'input') {
  var colFilterVal = event.filterValue.toLowerCase().replace(' ', '_');
  if (colFilterVal != undefined) {
  this.FilterTags.notifyServices(this.tableHeader2[i].key, colFilterVal);
  }
  } else if (col.filter['type'] === 'input' && (event.key === col.key)) {
  var colFilterVal = event.filterValue;
  if (event.keyCode == 13 && colFilterVal != undefined) {
  this.FilterTags.notifyServices(this.tableHeader2[i].key, colFilterVal);
  }
  }

  if (col.filter != undefined && colFilterVal != undefined) {
  // adding ?
  if (this.relativeUrl.indexOf('?') == -1) {
  this.relativeUrl += '?';
  }

  if (col.filter['type'] == 'dateRange') {
  // code...


  } else if (col.filter['type'] == 'dropdown' || (event.filterType == 'input' && (event.keyCode === 13))) {


  var queryParamKey = 'offset=';
  var offsetValue = 0;
  var queryParamValue = offsetValue;
  $(".pagination.justify-content-center li:nth-child(2)")[0].click();
  // this.pageSelected = 1;

  this.addQueryParam(queryParamKey, queryParamValue, false);

  if (event.key == col.key) {
  queryParamKey = col.key + '=';
  if (queryParamKey == "name=") {
  queryParamKey = "service=";

  } else if (queryParamKey == "lastModified=") {
  queryParamKey = "timestamp=";
  }
  queryParamValue = colFilterVal;
  this.addQueryParam(queryParamKey, queryParamValue, true);
  }

  }
  }
  }
  }


  onFilterSelected(selectedList){
    this.selectedListData = selectedList;

    var queryParamKey = 'offset=';
    var offsetValue = 0;
    $(".pagination.justify-content-center li:nth-child(2)")[0].click();
    // this.pageSelected = 1;
    this.addQueryParam(queryParamKey, offsetValue, false );

    queryParamKey = 'type=';

    // TODO: Address extant smells
    var queryParamValue = this.selectedListData[0].replace(/ /g,"-");
    if(queryParamValue == 'custom'){
      queryParamValue = 'sls-app'
    }
    if(queryParamValue == "all"){
      queryParamValue = "";
    }
    if (queryParamValue === 'custom') {
      queryParamValue = 'sls-app';
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
    // this.serviceList = this.sort.sortByColumn(col , reverse , function(x:any){return x;}, this.serviceList);

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
      // this.pageSelected = currentlyActivePage;
      this.serviceList = [];
      this.backupdata = [];



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
    this.FilterTags.notifyServices("search",searchbar.searchString);

    var queryParamKey = 'offset=';
    $(".pagination.justify-content-center li:nth-child(2)")[0].click();
    var offsetValue = 0;
    var queryParamValue = offsetValue;
    this.addQueryParam(queryParamKey, queryParamValue, false );
    queryParamKey = 'filter=';
    var queryParamValue2 = searchbar.searchString;
    this.addQueryParam(queryParamKey, queryParamValue2, true);
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
    // this.fetchServices();
    // this.paginatePage(1);
    // this.relativeUrl = '/jazz/services?limit=' + this.limitValue + '&offset=' + 0;
    this.serviceCall();
    this.paginationInit();
    this.updateList = this.cache.get("updateServiceList");
    this.updateServices(this.updateList);
  }
  refreshData(event){
    this.loadingState = 'default';
    this.updateList = this.cache.get("updateServiceList");
    if (this.updateList) {
      this.updateServices(this.updateList);
    } else {
      this.serviceCall();
    }
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
            this.serviceListEmpty = false;
            if (this.serviceList.length && pageCount > this.serviceCount) {
              this.serviceCount = pageCount;
              this.showToastSuccess(
                'Your service is ready',
                this.toastMessage.customMessage('successReady', 'createService'),
              );
            }
            this.serviceList = this.processServiceList(services);
            this.backupdata = this.processServiceList(services);
            this.loadingState = 'default';
          }
      });

    }
  }


  /**
   * Display success toast
   * @param title Toast title
   * @param body  Toast body
   * @returns
   */
  // TODO: Abstract out to service
  showToastSuccess (title: string, body: string): void {
    const options = {
      body: body,
      closeHtml: '<button>Dismiss</button>',
      showCloseButton: true,
      timeout: 5000,
      title: title,
      type: 'success',
    };

    // TODO: Investigate need for manual class addition
    const tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toasterService.pop(options);
  }


  closeDetelePopup(){
    this.setMessage("hide popup","no msg");
  }
  ngOnDestroy() {
    if(this.updateList){
      this.intervalSubscription.unsubscribe();
    }
  }
  ngOnChange(){
  }


}


