import { Component, OnInit, Input, ElementRef, Renderer, Output, EventEmitter } from '@angular/core';
import { DataCacheService , AuthenticationService , RequestService } from '../../core/services/index';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewChild } from '@angular/core';
import { DropdownComponent } from './../../primary-components/dropdown/dropdown.component';
import { environment } from './../../../environments/environment.oss';
import { environment as env_internal } from './../../../environments/environment.internal';
// import { Sort } from './jazz-table-sort';

@Component({
  selector: 'table-template',
  templateUrl: './table-template.component.html',
  styleUrls: ['./table-template.component.scss']
})
export class TableTemplateComponent implements OnInit {
  @Input() type: string = '';
  @Input() message: string = '';
  @Input() errcode:number;
	@Input() header: Array<any>;
	@Input() showFilters: boolean = false;
  @Input() isfromservice: boolean = false;
  @Input() isSort: boolean = false;
  @Input() state: string = 'default';
  @Input() showPaginationtable: boolean = true;
  @Input() currentlyActive: number = 1;
  @Input() totalPageNum: number = 12;
  @Output() onFilter:EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() refreshData:EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onSort:EventEmitter<any> = new EventEmitter<any>();
  @Output() paginatePage:EventEmitter<number> = new EventEmitter<number>();
  @ViewChild('dropthedown') dropdown:DropdownComponent;
  @Output() onHere:EventEmitter<boolean> = new EventEmitter<boolean>();

  errBody: any;
  error:any;
	parsedErrBody: any;
  errMessage: any;
  response: any;
  err_disp:boolean=true;
	errorChecked:boolean=true;
	errorInclude:any="";
  errorTime:any;
	errorURL:any;
	errorAPI:any;
	errorRequest:any={};
	errorResponse:any={};
	errorUser:any;
	json:any={};
	model:any={
		userFeedback : ''
  };
  toastmessage:any;
  private http:any;

	listenFunc: Function;

	getFilterType(column){
		if (column != undefined && column.filter != undefined) {
			return column.filter['type']
		}
		return '';
  }

  onRefresh(event){
    this.refreshData.emit(true);
  }

  resetInput(value,obj){

    if(value=='name'){
      this.header[0].filter.value='';
    }
    else if(value=='domain')
    {
      this.header[2].filter.value='';
    }
    else if(value=='status')
    {
      this.header[4].filter.value='all';
      this.dropdown.notifyDropdown('all');

    }
  }
  onFilterApplied(filter, column){

    if (column.filter['type'] == 'dropdown' && filter == 'all'){
    	filter = "";
    }
    else{
      column.keyCode = filter.keyCode;
    }

    column.filter._value = filter;
    this.onFilter.emit(column);
  };

  mySort(col, rev){
    if (col._reverse == undefined) {
      col._reverse = false;
    } else{
      if(rev){
        col._reverse = rev;
      }
      else{
        col._reverse = !col._reverse;
      }
    }
    return col._reverse;
  }

  onSortColumn(col, rev){
    for (var i = 0; i < this.header.length; i++) {
      var colSort = this.header[i];

      if (colSort.label == col.label) {
        colSort._reverse = this.mySort(col, rev);
        col._reverse = colSort._reverse;
      }
      else{
        colSort._reverse = undefined;
      }
    }
    this.onSort.emit({key:col.key, reverse: col._reverse})
   // this.isload = false;
  };
   paginatePageInTable(clickedPage){
     switch(clickedPage){
      case 'prev':
        if(this.currentlyActive > 1)
          this.currentlyActive = this.currentlyActive - 1;
        break;
      case 'next':
        if(this.currentlyActive < this.totalPageNum)
          this.currentlyActive = this.currentlyActive + 1;
        break;
      case '1':
        this.currentlyActive = 1;
        break;
      default:
        if(clickedPage > 1){
          this.currentlyActive = clickedPage;
        }
     }
     this.paginatePage.emit(this.currentlyActive);
   }
  // onSortColumn(key, reverse){
  // 	this.onSort.emit({key:key, reverse: (reverse || false)})
  // };

  constructor(elementRef: ElementRef, renderer: Renderer,private cache: DataCacheService, private request: RequestService , private router:Router, private authenticationservice:AuthenticationService) {
    this.http = request;
   }

  public goToAbout(hash){
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag',true);
    this.cache.set('scroll_id',hash);
 }
 isload:boolean = true;
 feedbackRes:boolean=false;
 openModal:boolean=false;
   feedbackMsg:string='';
  //  feedbackResSuccess:boolean=false;
   feedbackResSuccess:boolean=false;
 feedbackResErr:boolean=false;
 isFeedback:boolean=false;
   toast:any;
 buttonText:string='SUBMIT';
 isLoading:boolean=false;

 sjson:any={};
 djson:any={};
 // isLoading:boolean=false;
 reportIssue(){
   if(environment.envName != 'oss'){
  this.model.userFeedback = this.cache.get('feedback')
  this.errorAPI = this.cache.get('api')
  this.errorRequest = this.cache.get('request')
  this.errorResponse = this.cache.get('resoponse')
  this.errorURL = this.cache.get('url')
  this.errorTime = this.cache.get('time')
  this.errorUser = this.cache.get('user')

  this.json = {
    "user_reported_issue" : this.model.userFeedback,
    "API": this.errorAPI,
    "REQUEST":this.errorRequest,
    "RESPONSE":this.errorResponse,
    "URL": this.errorURL,
    "TIME OF ERROR":this.errorTime,
    "LOGGED IN USER":this.errorUser
}


       this.openModal=true;
       this.errorChecked=true;
       this.isLoading=false;
       this.errorInclude = JSON.stringify(this.djson);
       this.sjson = JSON.stringify(this.json);
     }
    }
     openFeedbackForm(){
       this.isFeedback=true;
       this.model.userFeedback='';
       this.feedbackRes=false;
       this.feedbackResSuccess=false;
       this.feedbackResErr=false;
       this.isLoading = false;
       this.buttonText='SUBMIT';
     }
     reportEmail:string;
     mailTo(){
       location.href='mailto:'+this.reportEmail+'?subject=Jazz : Issue reported by'+" "+ this.authenticationservice.getUserId() +'&body='+this.sjson;
     }
     errorIncluded(){
     }

     showService(){
      this.onHere.emit(true);
    }
     submitFeedback(action){

       this.errorChecked = (<HTMLInputElement>document.getElementById("checkbox-slack")).checked;
       if( this.errorChecked == true ){
        this.json = {
          "user_reported_issue" : this.model.userFeedback,
          "API": this.errorAPI,
          "REQUEST":this.errorRequest,
          "RESPONSE":this.errorResponse,
          "URL": this.errorURL,
          "TIME OF ERROR":this.errorTime,
          "LOGGED IN USER":this.errorUser
      }
       }else{
         this.json = this.model.userFeedback ;
       }
       this.sjson = JSON.stringify(this.json);

       this.isLoading = true;

       if(action == 'DONE'){
         this.openModal=false;
         return;
       }

       var payload={
         "title" : "Jazz: Issue reported by "+ this.authenticationservice.getUserId(),
         "project_id": env_internal.urls.internal_acronym,
         "priority": "P4",
         "description": this.json,
         "created_by": this.authenticationservice.getUserId(),
         "issue_type" :"bug"
       }
       this.http.post('/jazz/jira-issues', payload).subscribe(
         response => {
           this.buttonText='DONE';
           this.isLoading = false;
           this.model.userFeedback='';
           var respData = response.data;
           this.feedbackRes = true;
           this.feedbackResSuccess= true;
           if(respData != undefined && respData != null && respData != ""){
             this.feedbackMsg = "Thanks for reporting the issue. We’ll use your input to improve Jazz experience for everyone!";
           }
         },
         error => {
           this.buttonText='DONE';
           this.isLoading = false;
           this.feedbackResErr = true;
           this.feedbackRes = true;
           this.feedbackMsg = this.toastmessage.errorMessage(error, 'jiraTicket');
           }
       );
     }


     sendErrorCode(err){
       this.errcode=err;
     }
  ngOnInit() {
		for (var i = 0; i < this.header.length; i++) {
			var col = this.header[i]
			if (col.filter != undefined && col.filter['type'] == 'dropdown' && col.filter['data'] != undefined) {
        col.filter['data'].unshift('all')
        col.filter['value'] = 'all';

      }
    }



    if(this.message == undefined)
      {
        this.err_disp = false;
      }
      else{this.err_disp=true;}

  }

}
