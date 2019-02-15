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
  @Input() isAdminAccess: boolean = false;

  accessGranted:Boolean = false;
  i: number = 0;
  private http: any;
  private toastmessage: any = '';
  isLoading: boolean = false;
  isAddOrDelete: boolean = false;
  isDataNotAvailable: boolean = false;
  isError: boolean = false;
  errMessage: any;
  showManageGroup: boolean = false;
  showCodeGroup: boolean = false;
  showDeployGroup: boolean = false;
  usersList:any = [];
  access:any = {
    'manage': [],
    'code': [],
    'deploy': []
  }
  originalAccessDetails:any = [];
  aclPayload:any = {};
  showDisplay:Boolean = true;
  saveClicked:Boolean = false;
  iSelected: number = 0;
  removeUser: Boolean = false;
  confirmationHeader:string = "";
  confirmationText:string = "";
  focusindex: any = -1;
  scrollList: any = '';
  groupList:any = {
    'manage': [],
    'code': [],
    'deploy': []
  }
  deleteManageRule: boolean = false;
  toDelete: any = {};
  adminAccessRule: boolean = false;
  addAsAdmin: any = {};
  categoryArray: any = ['manage', 'code', 'deploy'];

  constructor(
    private request: RequestService,
    private toasterService: ToasterService,
    private messageservice: MessageService
  ) {
    this.http = request;
    this.toastmessage = messageservice;
  }

  // list of all the groups//
  getUsersList() {
    this.http.get('/jazz/usermanagement/users').subscribe(
      response => {
        if (response && response.data && response.data.result) {
          this.usersList = response.data.result;
          this.groupList.manage = (response.data.result).filter(user => user);
          this.groupList.code = (response.data.result).filter(user => user);
          this.groupList.deploy = (response.data.result).filter(user => user);

          if (this.originalAccessDetails.length) {
            this.removeExistingUser(this.originalAccessDetails);
          }
        }
      },
      error => {
        console.log(error)
      }
    )
  }

  // function to show group list(auto-complete)
  ongrpNameChange(category, i){
    this.iSelected = i;
    this.isAddOrDelete = true;
    if(category == 'manage'){
       this.showManageGroup = true;
    } else if(category == 'code'){
       this.showCodeGroup = true;
    } else if(category == 'deploy'){
       this.showDeployGroup = true;
    }
  }

// select user from the users list
  selectUser(user, i, category) {
    this.access[category][i].userId = user;
    this.removeUsersFromList(this.groupList[category], user);
    if(category == 'manage'){
      this.showManageGroup = false;
    } else if(category == 'code'){
      this.showCodeGroup = false;
    } else if(category == 'deploy'){
      this.showDeployGroup = false;
    }
  }

  // remove user from the users list
  removeUsersFromList(list, user) {
    list.map((eachUser, i) => {
      if (eachUser === user) {
        list.splice(i, 1)
      }
    });
  }

  // on delete add user back to the list
  addToList(category, user) {
    if (this.usersList.indexOf(user) !== -1) {
      this.groupList[category].push(user);
    }
  }

  //function for deleting group
  deletegroup(i,category){
    this.toDelete = {};
    if (this.access[category].length > 1) {
      if (category === "manage") {
        this.deleteManageRule = true;
        this.confirmationHeader = this.toastmessage.customMessage("finalConfirmationHeader", "aclConfirmation");
        this.confirmationText = this.toastmessage.customMessage("removeAdminRule", "aclConfirmation");
        this.toDelete["index"] = i;
        this.toDelete["category"] = category;
      } else {
        this.addToList(category, this.access[category][i].userId);
        this.access[category].splice(i, 1);
        this.isAddOrDelete = true;
      }
    } else {
      this.removeUser = true;
      this.confirmationHeader = this.toastmessage.customMessage("errorIndicationHeader", "aclConfirmation");
      this.confirmationText = this.toastmessage.customMessage( "errorIndicationMsg", "aclConfirmation");
    }

  }

  //function for adding group
 addgroup(category){
   let emptyInputAvalable = this.access[category].filter(each => (!each.userId))
   if (!emptyInputAvalable.length) {
    this.access[category].push({'userId': '','category': category, 'permission': 'read'});
    this.isAddOrDelete = true;
   }

  }

  onEditClick(){
    this.showDisplay = false;
  }

  //on save click form payload for /acl/policies
  onSaveClick(){
    this.saveClicked = true;
    this.aclPayload["serviceId"] = this.service.id;
    let policiesList = Object.keys(this.access).map(eachcat => (this.access[eachcat]))
    let list = [].concat.apply([], policiesList);
    this.aclPayload["policies"] = list;
    this.confirmationHeader = this.toastmessage.customMessage("finalConfirmationHeader", "aclConfirmation");
    this.confirmationText = this.toastmessage.customMessage("finalConfirmationMsg", "aclConfirmation");
  }

  //on cancel restore the changes
  onCancelClick(){
    if (this.isAddOrDelete) {
      this.access = this.restructureRes(this.originalAccessDetails);
      this.getUsersList()
    }
    this.showDisplay = true;
    this.isAddOrDelete = false;
  }

  // on complete send request to updateAclPolicies()
  onCompleteClick() {
    if (this.saveClicked) {
      this.saveClicked = false;
      this.updateAclPolicies(this.aclPayload);
      this.showDisplay = true;
    }

    if (this.removeUser) {
      this.removeUser = false;
    }

    if (this.deleteManageRule && Object.keys(this.toDelete).length > 0) {
      let category = this.toDelete.category;
      let i = this.toDelete.index;
      this.addToList(category, this.access[category][i].userId);
      this.access[category].splice(i, 1);
      this.isAddOrDelete = true;
      this.deleteManageRule = false;
      this.toDelete = {};
    }

    if (this.adminAccessRule && Object.keys(this.addAsAdmin).length) {
      this.access[this.addAsAdmin.category][this.addAsAdmin.index].permission = this.addAsAdmin.value;
      this.isAddOrDelete = true;
      this.adminAccessRule = false;
    }

  }

  //on refresh load the acl view
  refresh(){
    this.getAclPolicies(this.service.id);
    this.getUsersList()
  }

  reportIssue() {}

  onSelectionChange(value, index, category){
    if (category === "manage" && value === "admin") {
      this.addAsAdmin = {};
      this.adminAccessRule = true;
      this.confirmationHeader = this.toastmessage.customMessage("finalConfirmationHeader", "aclConfirmation");
      this.confirmationText = this.toastmessage.customMessage("addAdminRule", "aclConfirmation");
      this.addAsAdmin = {
        "category": category,
        "index": index,
        "value": value
      }
    } else {
      this.access[category][index].permission = value;
      this.isAddOrDelete = true;
    }

  }

  ngOnInit() {
    this.getUsersList()
    this.getAclPolicies(this.service.id);
    this.isValidData();
  }

  // restructure the response
  restructureRes(policies) {
    let catogarisedList ={};
    this.categoryArray.forEach(eachCat => {
      catogarisedList[eachCat] = policies.filter(eachPolicy => {
        return (eachPolicy.category === eachCat)
      });
    });
    return catogarisedList;
  }

  // remove existing users from users list
  removeExistingUser(originalAccessDetails) {
    originalAccessDetails.forEach(eachPolicy => {
      this.removeUsersFromList(this.groupList[eachPolicy.category], eachPolicy.userId);
    });
  }

  //get policies for provided service
  getAclPolicies(serviceId) {
    this.isLoading = true;
    this.http.get(`/jazz/acl/policies?serviceId=${serviceId}`, null, serviceId).subscribe(
      response => {
        if (response && response.data && response.data.policies && response.data.policies.length) {
          this.originalAccessDetails = JSON.parse(JSON.stringify(response.data.policies))
          this.access = this.restructureRes(JSON.parse(JSON.stringify(response.data.policies)));
          this.removeExistingUser(this.originalAccessDetails);
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

  // update policies
  updateAclPolicies(payload) {
    this.isLoading = true;
    this.http.post('/jazz/acl/policies', payload, this.service.id).subscribe(
      response=> {
        let successMessage = this.toastmessage.successMessage(response, "updateServicePolicies");
        this.toast_pop('success', "", "Policies for service: " + this.service.name + " are " + successMessage);
        this.getAclPolicies(this.service.id)
      },
      error => {
        let errorMessage = this.toastmessage.errorMessage(error, "updateServicePolicies");
        this.toast_pop('error', 'Oops!', errorMessage)
        this.getAclPolicies(this.service.id)
      }
    );
  }

  // validate user details from the policies list
  isValidData() {
    if (this.isAddOrDelete) {
      let policiesList = Object.keys(this.access).map(eachcat => (this.access[eachcat]))
      let list = [].concat.apply([], policiesList);
      let checkLen = [], isAdminOrWrite = false;

      this.categoryArray.forEach(eachCat=> {
        if (this.access[eachCat].length === 1 && this.access[eachCat][0].permission === 'read') {
          checkLen.push(this.access[eachCat][0]);
        } else if (this.access[eachCat].length > 1) {
          this.access[eachCat].forEach(eachObj => {
            if (eachObj.permission === "admin" || eachObj.permission === "write") {
              isAdminOrWrite = true;
              return;
            }
          })
        }
      });

      let check = list.filter(each => {
        if (!each.userId) {
          return true
        } else if (this.usersList.indexOf(each.userId) === -1) {
          return true
        }

      });
      if (!check.length && !checkLen.length && isAdminOrWrite) return false;
      else return true;
    }
  }

  ngOnChanges(x: any) {
    this.isValidData()
  }

  keypress(hash, i, category) {
    if (hash.key == 'ArrowDown') {
      this.focusindex++;
      if (this.focusindex >= 0) {
        var pinkElements = document.getElementsByClassName("pinkfocususers")[0];
        if (pinkElements == undefined) {
          this.focusindex = 0;
        }
      }
      if (this.focusindex > 2) {
        this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };

      }
    }
    else if (hash.key == 'ArrowUp') {
      if (this.focusindex > -1) {
        this.focusindex--;

        if (this.focusindex > 1) {
          this.scrollList = { 'position': 'relative', 'top': '-' + ((this.focusindex - 2) * 2.9) + 'rem' };
        }
      }
      if (this.focusindex == -1) {
        this.focusindex = 0;
      }
    }
    else if (hash.key == 'Enter' && this.focusindex > -1 && this.groupList[category].length) {
      event.preventDefault();
      var pinkElement;
      pinkElement = document.getElementsByClassName("pinkfocususers")[0].children;
      this.access[category][i].userId = pinkElement[0].attributes[1].value;
      this.selectUser(this.access[category][i].userId, i, category)
      this.focusindex = -1;
    } else {
      this.focusindex = -1;
    }
  }

  outSidePopup() {
    this.saveClicked = false;
    this.removeUser = false;
    this.deleteManageRule = false;
    this.adminAccessRule = false;
    if (Object.keys(this.addAsAdmin).length) {
      this.access[this.addAsAdmin.category][this.addAsAdmin.index].permission = "read";
    }
  }

}
