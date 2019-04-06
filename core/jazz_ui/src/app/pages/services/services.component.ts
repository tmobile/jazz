/** 
  * @type Component 
  * @desc service flow parent component
  * @author
*/

import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {


 /*  @Output() createServiceSlider:EventEmitter<boolean> = new EventEmitter<boolean>();*/

  constructor() { }
  
  selectedTab = 0;
  mobSecState:number = 1;
  showAddService: boolean = false;
  selected:string = "Status (All)";
  serviceList = [
    { name: 'Service One', type: 'API', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 2, status: 'Active', link:"services/service_1" },
    { name: 'Service Two', type: 'Function', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 2, status: 'Active', link:"services/service_2" },
    { name: 'Service Three', type: 'Function', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 2, status: 'Active', link:"services/service_3" },
    { name: 'Service Four', type: 'API', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 1, status: 'Pending approval', link:"services/service_4" },
    { name: 'Service Five', type: 'Website', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 1, status: 'Pending approval', link:"services/service_5" },
    { name: 'Service Six', type: 'Website', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 0, status: 'Stopped', link:"services/service_6" },
    { name: 'Service Seven', type: 'Website', domain: 'pacman', 'lastModified': '10-10-17 11:59:59 PST', health: 0, status: 'Stopped', link:"services/service_7" }
  ];

  mobTabData:any = ['Dashboard','Services','Activity'];

  tableHeader = [{"name" : "Name","field" : "name"},{"name" : "Type","field" : "type"},{"name" : "Namespace","field" : "domain"},{"name" : "Last modified","field" : "lastModified"},{"name" : "Health","field" : "health"},{"name" : "Status","field" : "status"}];
  //'Name','Type','Namespace','Last modified','health','status'
  statusData = ['Status (All)','Status (Active)','Status (Pending)','Status (Stopped)'];
  tabData = ['All','Api','Function','Website','sls app'];
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
  }];

  tabChanged (i){
    this.selectedTab = i;
  };

  statusFilter(item){
    this.selected = item;
    // this.filterByStatus();
  }

  showService(isShow){
    this.showAddService = isShow;
  }

  public changeActivity(data){
    this.mobSecState = data;
  }

  ngOnInit() {
  }
}

