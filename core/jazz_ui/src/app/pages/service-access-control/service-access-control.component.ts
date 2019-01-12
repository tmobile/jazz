/** 
  * @type Component 
  * @desc Service access control page
  * @author
*/

import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'service-access-control',
  templateUrl: './service-access-control.component.html',
  styleUrls: ['./service-access-control.component.scss']
})
export class ServiceAccessControlComponent implements OnInit {

  accessGranted:Boolean = false;
  i: number = 0;
  groupStatus:any = ['Read' , 'Manage' , 'Admin'];
  grpName:string;
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
        'readOnly':true,
        'userType':"Read Only"
    }],
    'deploy' : [{
        'name': 'John Smith (jSmith)',
        'readOnly':true
    },{
      'name': 'John Smith (jSmith)',
      'readOnly':true
    },{
      'name': 'John Smith (jSmith)',
      'readOnly':true
    }]
  }

  // list of all the groups//
  groupList: any = [{'givenName':'group one'}, {'givenName':'group two'}, {'givenName':'group three'},{'givenName':'group four'},{'givenName':'group five'},{'givenName':'group six'},{'givenName':'group seven'}]
  
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
  deletegroup(i,category){
    if(category == 'manage'){
       this.groupsAccess.manage.splice(i,1);
    } else if(category == 'code'){
       this.groupsAccess.code.splice(i,1);
    } else if(category == 'deploy'){
       this.groupsAccess.deploy.splice(i,1);
    } 
  }
  
  //function for adding group
  addgroup(i,category){
    if(category == 'manage'){
       this.groupsAccess.manage.push({'name': '','accessType':'read'});
    } else if(category == 'code'){
       this.groupsAccess.code.push({'name': '','accessType':'read'});
    } else if(category == 'deploy'){
       this.groupsAccess.deploy.push({'name': '','accessType':'read'});
    } 
  }

  onEditClick(){
     this.showDisplay = false;
  }

  onSaveClick(){
     this.showDisplay = true;
  }
  onCancelClick(){
   this.showDisplay = true;
  }
  refresh(){

  }
  //function for selecting group from list of groups//
  selectApprovers(group, index , category){
     if(category == 'manage'){
       this.groupsAccess.manage[index].name = group.givenName;
       this.groupsAccess.manage[index].showGroups = false;
    } else if(category == 'code'){
       this.groupsAccess.code[index].name = group.givenName;
       this.groupsAccess.code[index].showGroups = false;
    } else if(category == 'deploy'){
       this.groupsAccess.deploy[index].name = group.givenName;
       this.groupsAccess.deploy[index].showGroups = false;
    } 
  }
  
  // function to update data whenever radio status is changed(read , manage, admin)
  onSelectionChange(value,index){
      this.groupsAccess.code[index].accessType = value;
  }

  onManagementChange(value,index){
   this.groupsAccess.manage[index].accessType = value;
  }


  constructor() {
   
   }

  ngOnInit() {
  }

}
