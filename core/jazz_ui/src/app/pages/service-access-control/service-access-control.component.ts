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
  isLoading: boolean = false;
  isAddOrDelete: boolean = false;
  isDataNotAvailable: boolean = false;
  isError: boolean = false;
  errMessage: any;
  showManageGroup: boolean = false;
  showCodeGroup: boolean = false;
  showDeployGroup: boolean = false;
  manageGroupList:any = [];
  codeGroupList: any = [];
  deployGroupList: any = [];
  access:any = {
    'manage': [],
    'code': [],
    'deploy': []
  }
  originalAccessDetails:any = {};
  aclPayload:any = {};
  showDisplay:Boolean = true;
  groupList: any = []

  // list of all the groups//
  getUsersList() {
    this.http.get('/jazz/users').subscribe(
      response => {
        this.manageGroupList = response.data;
        this.codeGroupList = response.data;
        this.deployGroupList = response.data;
      },
      error => {
        console.log(error)
      }
    )
  }

  // function to show group list(auto-complete)
  ongrpNameChange(category, i){

    // if(category == 'manage'){
    //    this.showManageGroup = true;
    // } else if(category == 'code'){
    //    this.showCodeGroup = true;
    // } else if(category == 'deploy'){
    //    this.showDeployGroup = true;
    // }
  }

  //function for deleting group
  deletegroup(i,category, group){
    this.access[category].splice(i, 1);
    this.isAddOrDelete = true;
  }

  //function for adding group
 addgroup(i, category){
   this.access[category].push({'userId': '','category': category, 'permission': 'read'});
   this.isAddOrDelete = true;

  }

  onEditClick(){
    this.showDisplay = false;
  }

  onSaveClick(){
     this.showDisplay = true;
     this.aclPayload["serviceId"] = this.service.id;
     let policiesList = Object.keys(this.access).map(eachcat => (this.access[eachcat]))
     this.aclPayload["policies"] = [].concat.apply([], policiesList);;
     this.updateAclPolicies(this.aclPayload);
  }

  onCancelClick(){
    if (this.isAddOrDelete) {
      this.access = this.restructureRes(this.originalAccessDetails);
    }
    this.showDisplay = true;
  }

  refresh(){
    this.getAclPolicies(this.service.id);
  }

  reportIssue() {}

  onSelectionChange(value, index, category){
    this.access[category][index].permission = value;
  }

  constructor(
    private request: RequestService,
    private toasterService: ToasterService,
    private messageservice: MessageService
  ) {
    this.http = request;
    this.toastmessage = messageservice;
   }

  ngOnInit() {
    this.getUsersList()
    this.getAclPolicies(this.service.id);
  }

  restructureRes(policies) {
    let catogarisedList ={};
    ['manage', 'code', 'deploy'].forEach(eachCat => {
      catogarisedList[eachCat] = policies.filter(eachPolicy => {
        return (eachPolicy.category === eachCat)
      });
    });
    return catogarisedList;
  }

  getAclPolicies(serviceId) {
    this.isLoading = true;
    this.http.get(`/jazz/acl/policies?serviceId=${serviceId}`).subscribe(
      response => {
        if (response && response.data && response.data.policies && response.data.policies.length) {
          this.access = this.restructureRes(response.data.policies);
          this.originalAccessDetails = response.data.policies;
        } else {
          this.isDataNotAvailable = true;
        }
        this.isLoading = false;
      },
      error => {
        this.isLoading = false;
        this.isError =true;
        this.errMessage = this.toastmessage.errorMessage(error, "updateServicePolicies");
      }
    );
  }

  toast_pop(error, oops, errorMessage) {
    var tst = document.getElementById('toast-container');
    tst.classList.add('toaster-anim');
    this.toasterService.pop(error, oops, errorMessage);
    setTimeout(() => {
      tst.classList.remove('toaster-anim');
    }, 3000);
  }

  updateAclPolicies(payload) {
    this.isLoading = true;
    this.http.post('/jazz/acl/policies', payload).subscribe(
      response=> {
        this.isLoading = false;
        let successMessage = this.toastmessage.successMessage(response, "updateServicePolicies");
        this.toast_pop('success', "", "Policies for service: " + this.service.name + " are " + successMessage);
      },
      error => {
        this.isLoading = false;
        let errorMessage = this.toastmessage.errorMessage(error, "updateServicePolicies");
        this.toast_pop('error', 'Oops!', errorMessage)
      }
    )
  }
}
