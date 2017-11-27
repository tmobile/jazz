import { Component, OnInit } from '@angular/core';
import { RequestService, DataCacheService, MessageService } from "../../core/services";

@Component({
  selector: 'jenkins-status',
  templateUrl: './jenkins-status.component.html',
  styleUrls: ['./jenkins-status.component.scss']
})
export class JenkinsStatusComponent implements OnInit {
  

  constructor(
    private http: RequestService,
    private cache: DataCacheService,
    private messageservice: MessageService) { }
    message : string = "";
    action : string;
    noLink:boolean = true;
    goToLogin:boolean = false;

  public onLoginClicked (goToLogin) {
    this.goToLogin = goToLogin;
    this.closed = false;
  }
  closed:boolean=true;
  public closeSidebar (eve){
      this.goToLogin = false;
      this.closed = true;
  }

  ngOnInit() {
     var url_search = window.location.search;
     var urlParams = new URLSearchParams(url_search);
    
    let action = urlParams.get("action"); 
    this.action = action;
    
    let deploymentId = urlParams.get("id"); 
    
    var url =  "/jazz/approve-deployment";

    var payload = { "action": action, "id": deploymentId};
  	this.makeRequest(url,payload);
  }

  status: string = 'loading';

  makeRequest(url,payload) {
    this.status = 'loading';
    this.http.post(url,payload)
      .subscribe(
      (Response) => {
        var output = Response;
        //APPROVED, ABORTED,ALREADY_APPROVED, ALREADY_REJECTED,ALREADY_EXPIRED
        
        if (output.data !== undefined && (output.data.status === 'EXPIRED' || output.data.status === 'ALREADY_EXPIRED')) {
          this.status = 'expired';
          this.message = output.data.message;
          
        } 
        else if(output.data !== undefined && (output.data.status === 'APPROVED' || output.data.status === 'ALREADY_APPROVED') && this.action === "proceed")
        {
          this.status = 'success';
          this.message = output.data.message;
        }
         else if(output.data !== undefined && (output.data.status === 'APPROVED' || output.data.status === 'ALREADY_APPROVED') && this.action === "abort")
        {
          this.status = 'error2';
          this.message = output.data.message;//"Deployment already approved!";
        }
        else if(output.data !== undefined && (output.data.status === 'REJECTED' || output.data.status === 'ALREADY_REJECTED'))
        {
          this.status = 'rejected';
          this.message = output.data.message;
        }
        else if(output.data !== undefined && (output.data.status === 'ABORTED'))
        {
          this.status = 'aborted';
          this.message = output.data.message;
        }
        else{
          this.status = 'success';
          this.message = "Deployment request to production environment is " + this.action ;
        }
      },
      (error) => {
        this.status = 'error';
        this.message = "";
      }
    );
  }
}
