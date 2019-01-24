/**
  * @type Component
  * @desc Service access control page
  * @author
*/

import { Component, Input, OnInit } from '@angular/core';
import { ToasterService } from 'angular2-toaster';
import { RequestService, MessageService } from '../../core/services';


@Component({
  selector: 'service-access-control',
  templateUrl: './service-access-control.component.html',
  providers: [RequestService, MessageService],
  styleUrls: ['./service-access-control.component.scss']
})
export class ServiceAccessControlComponent implements OnInit {
  "usestrict"
  @Input() service: any = {};

  accessGranted:Boolean = false;
  i: number = 0;
  groupStatus:any = ['Read' , 'Manage' , 'Admin'];
  grpName:string;
  resMessage : any;
  approversListShow: any;
  private http: any;
  private toastmessage: any = '';
  approversListRes: any;
  disableCode: boolean = false;
  disableManage: boolean = false;
  disableDeploy: boolean = false;
  isLoading: boolean = false;
  isAddOrDelete: boolean = false;
  access:any = {
    'manage': [],
    'code': [],
    'deploy': []
  }
  originalAccessDetails:any = {};
  aclPayload:any = {};
  restorePolicies:any = [];

  public newGroup: any = {
    'name': '',
    'accessType':'read'
  }
  showDisplay:Boolean = true;
  // list groups which has access for specific action//
  groupsAccess: any = {
    'manage': [{
        'name': 'John Smith (jSmith)',
        'readOnly':false,
        'accessType':'admin',
        "userType": 'Admin'
    }],
    'code' : [{
        'name': 'John Smith (jSmith)',
        'accessType':'read',
        'readOnly':false,
        'userType':"Read Only"
    }],
    'deploy' : [{
        'name': 'John Smith (jSmith)',
        'readOnly':false
    },{
      'name': 'John Smith (jSmith)',
      'readOnly':false
    },{
      'name': 'John Smith (jSmith)',
      'readOnly':false
    }]
  }

  // list of all the groups//
  groupList: any = []
  getUsersList() {
    this.http.get('/jazz/users').subscribe(
      response => {
        console.log(response)
        this.groupList = response.data;
      },
      error => {
        console.log(error)
      }
    )
  }
  // function to show group list(auto-complete)
  ongrpNameChange(category, i){
    if(category == 'manage'){
       this.groupsAccess.manage[i].showGroups = true;
    } else if(category == 'code'){
       this.groupsAccess.code[i].showGroups = true;
    } else if(category == 'deploy'){
       this.groupsAccess.deploy[i].showGroups = true;
    }
  }

  //function for deleting group
  deletegroup(i,category, group){
    this.access[category].splice(i, 1);
    console.log("deleted group: ", group);
    this.restorePolicies.push(group);
    this.isAddOrDelete = true;

    // if(category == 'manage'){
    //   this.access.manage.splice(i,1);
    //   if(this.access.manage.length == 1)
    //     this.disableManage = true;
    //   else
    //     this.disableManage = false
    // } else if(category == 'code'){
    //   this.access.code.splice(i,1);
    //   if(this.access.code.length == 1)
    //    this.disableCode = true;
    //   else
    //    this.disableCode = false;
    // } else if(category == 'deploy'){
    //   this.access.deploy.splice(i,1);
    //   if(this.access.deploy.length == 1)
    //     this.disableDeploy = true;
    //   else
    //     this.disableDeploy = false;
    // }
  }

  //function for adding group
 addgroup(i, category){
   alert(category+  i);
  //  if (this.access[category])
   this.access[category].push({'userId': '','category': category, 'permission': 'read'});
   this.isAddOrDelete = true;
    // if(category == 'manage'){
    //    this.access.manage.push({'userId': '','category':'manage', 'permission':"read"});
    //    if(this.access.manage.length == 1)
    //      this.disableManage = true;
    //   else
    //      this.disableManage = false;
    // } else if(category == 'code'){
    //      this.access.code.push({'userId': '','category':'code', 'permission':"read"});
    //      if(this.access.code.length == 1)
    //         this.disableCode = true;
    //      else
    //         this.disableCode = false;
    // } else if(category == 'deploy'){
    //      this.access.deploy.push({'userId': '','category':'deploy', 'permission':"read"});
    //      if(this.access.deploy.length == 1)
    //         this.disableDeploy = true;
    //      else
    //         this.disableDeploy = false;
    // }
  }

  onEditClick(){
    this.showDisplay = false;

    if (this.access.code.length == 1)
      this.disableCode = true;
    else
        this.disableCode = false;

    if (this.access.manage.length == 1)
        this.disableManage = true;
    else
        this.disableManage = false;

    if (this.access.deploy.length == 1)
        this.disableDeploy = true;
    else
        this.disableDeploy = false;
  }

  onSaveClick(){
     this.showDisplay = true;
     this.aclPayload["serviceId"] = this.service.id;

     let policiesList = Object.keys(this.access).map(eachcat => (this.access[eachcat]))
     console.log(policiesList)
     this.aclPayload["policies"] = [].concat.apply([], policiesList);;
     this.updateAclPolicies(this.aclPayload);
  }

  onCancelClick(){

   if (this.restorePolicies.length) {
    this.access = this.originalAccessDetails;
   }
   console.log(this.originalAccessDetails);
   console.log(this.access);
   if (this.isAddOrDelete) {
     alert("add or delete")
    this.access = this.originalAccessDetails;
   }
   this.showDisplay = true;
  }

  refresh(){
    this.getAclPolicies(this.service.id);
  }

   onSelectionChange(value, index, category){
      this.access[category][index].permission = value;
      // if(this.groupsAccess.code[index].accessType == 'read')
      //    this.groupsAccess.code[index].userType = "Read Only";
      // else
      //    this.groupsAccess.code[index].userType = "Write";
  }

  // onManagementChange(value,index){
  //     this.access.manage[index].permission = value;
  //     // if(this.access.manage[index].permission == 'read')
  //     //    this.access.manage[index].userType = "Read Only";
  //     // else
  //     //    this.access.manage[index].userType = "Admin";
  // }

  constructor(
    private request: RequestService
  ) {
    this.http = request;
   }

  ngOnInit() {
    this.getUsersList()
    console.log(this.service);
    this.getAclPolicies(this.service.id);
  }

  getAclPolicies(serviceId) {
    this.isLoading = true;
    console.log("serviceId is: ", serviceId);
    this.http.get(`/jazz/acl/policies?serviceId=${serviceId}`).subscribe(
      response => {

        console.log("response: " + JSON.stringify(response.data));
        ['manage', 'code', 'deploy'].forEach(eachCat => {
          this.originalAccessDetails[eachCat] = response.data.policies.filter(eachPolicy => {
            return (eachPolicy.category === eachCat)
          });
        });
        console.log(this.originalAccessDetails);
        this.access = Object.assign({}, this.originalAccessDetails);

        console.log(this.access);
        this.isLoading = false;
      },
      error => {
        console.log("error: " + JSON.stringify(error));
        this.isLoading = false;
      }
    );
  }

  updateAclPolicies(payload) {
    this.isLoading = true;
    console.log("payload: ", payload);
    this.http.post('/jazz/acl/policies', payload).subscribe(
      response=> {
        console.log("response: " + JSON.stringify(response.data));
        this.isLoading = false;
      },
      error => {
        console.log("error: " + JSON.stringify(error));
        this.isLoading = false;
      }
    )
  }
}
