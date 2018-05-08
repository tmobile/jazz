/** 
  * @type Component 
  * @desc 
  * @author
*/


import { Component, OnInit, EventEmitter,Input,Output,ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TableTemplateComponent } from './../table-template/table-template.component';

@Component({
  selector: 'overview-sidebar',
  templateUrl: './overview-sidebar.component.html',
  styleUrls: ['./overview-sidebar.component.scss']
})
export class OverviewSidebarComponent implements OnInit {

  @Output() onClose: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('tabletemplate') tableTemplate:TableTemplateComponent;



  title:string='Service One\'s Endpoints';
  endpEmpty:boolean=false;
  filterSelected:boolean = false;
  errMessage:string='';
  errCode:number;
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
        type: 'input'
      }
    },{
      label: 'ARN Link',
      key: 'arnlink',
      sort: false,
      
    }
  ];
  endpList = [{
    name:'tmo-dev-ops',
    arn:'arn:test1',
    type:'Account',
  },
  {
    name:'tmo-dev-ops',
    arn:'arn:test2',
    type:'Account'
  },
  {
    name:'us-west-2',
    arn:'arn:test3',
    type:'Region'
  },
  {
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },
  {
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'us-west-2',
    arn:'arn:test3',
    type:'Region'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'us-west-2',
    arn:'arn:test3',
    type:'Region'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'us-west-2',
    arn:'arn:test3',
    type:'Region'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },{
    name:'tmo-dev-ops',
    arn:'arn:test123',
    type:'Account'
  },
];

popup(state,i){
  if(state == 'enter'){
    this.copyLink = "COPY LINK TO CLIPBOARD";
    var ele = document.getElementsByClassName('new-pop');
  ele[i].classList.add('endp-visible');
  }
  if(state == 'leave'){
    var ele = document.getElementsByClassName('new-pop');
    ele[i].classList.remove('endp-visible');
  }
  
}

copyLink:string="COPY LINK TO CLIPBOARD";
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  closeBar(flag) {
    
    this.onClose.emit(false);
  }
  onFilter(event){
     
  }

  onSort(event){
     
  }
  paginatePage(event){

  }

  onRowClicked(row,i){

  }
  ngOnInit() {
  }

 
 
 
 
 onServiceSearch(event){

 }

 copyClipboard(copyapilinkid){


    var element = null; // Should be <textarea> or <input>
    element = document.getElementById("myid");
    element.select();
    try {
        document.execCommand("copy");
        this.copyLink = "LINK COPIED TO CLIPBOARD";
        setTimeout(() => {
          this.copyLink = "COPY LINK TO CLIPBOARD";
        }, 3000);
        
    }
    finally {
      document.getSelection().removeAllRanges;
    }
  }
  
 

}
