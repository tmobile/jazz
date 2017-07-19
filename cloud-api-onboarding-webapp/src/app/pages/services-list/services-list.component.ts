/** 
  * @type Component 
  * @desc service list Page
  * @author
*/

import { Component, OnInit, EventEmitter, Output} from '@angular/core';
import { ToasterService} from 'angular2-toaster';
import { Filter } from '../../secondary-components/tmobile-table/tmobile-filter';
import { Sort } from '../../secondary-components/tmobile-table/tmobile-table-sort';
import { SharedService } from "../../SharedService.service";
import { RequestService } from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';

declare var $:any;

@Component({
  selector: 'services-list',
  templateUrl: './services-list.component.html',
  providers: [RequestService],
  styleUrls: ['./services-list.component.scss']
})

export class ServicesListComponent implements OnInit {

  // @Output() onClose:EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private sharedService: SharedService, private router: Router, private request: RequestService, private toasterService: ToasterService) { 
    this.message = this.sharedService.sharedMessage;
    this.toasterService = toasterService;

    this.http = request;
  }

  popToast(type, title, message) {
      this.toasterService.pop(type, title, message);
  }

  private http: any;

  selectedTab = 0;
  showAddService: boolean = false;
  selected:string = "Status (All)";
  thisIndex: number = 0;
  breadcrumbs = [{
    'name' : 'Service',
    'link' : 'services'
  }]
  serviceList = [];

  serviceListOld = [
    { name: 'Service One', type: 'API', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 2, status: 'Active', link:"services/service_1" },
    { name: 'Service Two', type: 'Function', domain: 'cloud', 'lastModified': '10-10-17 11:59:59 PST', health: 2, status: 'Active', link:"services/service_2" },
    { name: 'Service Three', type: 'Function', domain: 'platform', 'lastModified': '10-10-17 11:59:59 PST', health: 2, status: 'Active', link:"services/service_3" },
    { name: 'Service Four', type: 'API', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 1, status: 'Pending approval', link:"services/service_4" },
    { name: 'Service Five', type: 'Website', domain: 'commerce', 'lastModified': '10-10-17 11:59:59 PST', health: 1, status: 'Pending approval', link:"services/service_5" },
    { name: 'Service Six', type: 'Website', domain: 'sales', 'lastModified': '10-10-17 11:59:59 PST', health: 0, status: 'Deleting', link:"services/service_6" },
    { name: 'Service seven', type: 'Website', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 0, status: 'Stopped', link:"services/service_7" }
  ];

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
      label: 'Domain',
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
      label: 'Health',
      key: 'health',
      sort: true,
      filter: {
        type: ''
      }
    },{
      label: 'Status',
      key: 'status',
      sort: true,
      filter: {
        type: 'dropdown',
        data: ['Active', 'Pending', 'Stopped']
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
  tabData = ['api','function','website'];

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
  searchActive: Boolean = false;
  searchbar: string = '';
  errorMsg: string = '';
  filter:any;
  sort:any;
  loadingState: string = '';
  selectedListData:any;

  message;

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
        status: 'Active',
        lastModified: service.timestamp,
        link: 'services/' + service.id
      };
      _serviceList.push(serviceRow);
    });

    return _serviceList;
  };

  fetchServices(){
    this.loadingState = 'loading';

    // this.http.get('https://dev-cloud-api.corporate.t-mobile.com/api/platform/services');
    this.http.get('https://dev-cloud-api.corporate.t-mobile.com/api/platform/services').subscribe(
      response => {
          //Bind to view
          let services = response.data;

          if (services !== undefined && services !== "" && services.length !== undefined) {
            this.serviceList = this.processServiceList(services);
            this.backupdata = this.processServiceList(services);
            this.loadingState = 'default';
          } else{
            this.loadingState = 'error';
            this.popToast('error', 'Error', 'No data recieved')
          }
        },
        err => {
            this.loadingState = 'error';
            this.popToast('error', 'Error', 'Service list could not be fetched.')
            // Log errors if any
        }
      )
  };

  onRowClicked (rowData){
      if (rowData != undefined) {
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

  onFilter(column){
    this.serviceList = this.backupdata;

    for (var i = 0; i < this.tableHeader2.length; i++) {
      var col = this.tableHeader2[i]
      if (col.filter != undefined && col.filter['_value'] != undefined) {
        if (col.filter['type'] == 'dateRange') {
          // code...
        } else{
          this.serviceList  = this.filter.filterFunction(col.key , col.filter['_value'], this.serviceList);
        }
      }
    }
  };

  onSort(sortData){

    var col = sortData.key;
    var reverse = false;
    if (sortData.reverse == true) {
      reverse = true
    }

    this.serviceList = this.sort.sortByColumn(col , reverse , function(x:any){return x;}, this.serviceList);
  };

  onServiceSearch(searchbar){
      // this.serviceList = this.backupdata;
      this.searchbar = searchbar;
      this.onFilterSelected(this.selectedListData);
      // this.serviceList  = this.filter.searchFunction("any" , searchbar , this.serviceList);
  };
  tabChanged (i){
    this.selectedTab = i;
  };

  statusFilter(item){
    this.selected = item;
  
  }

  showService(isShow){
    this.showAddService = isShow;
  }

  onFilterSelected(selectedList){
    this.selectedListData = selectedList;
		this.serviceList = this.filter.filterListFunction('type' , this.selectedListData , this.backupdata);
    this.serviceList  = this.filter.searchFunction("any" , this.searchbar , this.serviceList);
	}

  deleteService(){
    this.serviceList = this.serviceList.filter(element => {
        return element.status != "Deleting";
    });
  }

  backupdata = [];
  ngOnInit() {
    this.backupdata = this.serviceList;
  	this.filter = new Filter(this.serviceList);
    this.sort = new Sort(this.serviceList);
    setTimeout(() => {
      this.closeDetelePopup();
    }, 3000);

    this.fetchServices();
  }
  closeDetelePopup(){
    this.setMessage("hide popup","no msg");
  }



}

$( document ).ready(function() {
});