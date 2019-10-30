import { Component, OnInit, Input } from '@angular/core';
import { RequestService , MessageService , AuthenticationService } from "../../core/services";
import { Router, ActivatedRoute } from '@angular/router';
import { HttpModule } from '@angular/http';
import { DataCacheService } from '../../core/services/index';
import { Filter } from '../../secondary-components/jazz-table/jazz-filter';
import { Sort } from '../../secondary-components/jazz-table/jazz-table-sort';
import { ToasterService } from 'angular2-toaster';

@Component({
  selector: 'jenkins-status',
  templateUrl: './jenkins-status.component.html',
  styleUrls: ['./jenkins-status.component.scss']
})
export class JenkinsStatusComponent implements OnInit {


  constructor(
    private authService: AuthenticationService,
    private http: RequestService,
    private route: ActivatedRoute,
		private router: Router,
    private cache: DataCacheService,
    private toasterService: ToasterService,
    private messageservice: MessageService) { this.toastmessage = messageservice;}
    message : string = "";
    successmessage : string = "";
    private toastmessage:any = '';
    serviceID:any;
    action : string;
    noLink:boolean = true;
    goToLogin:boolean = false;
    rebuild_deployments:boolean = false;


  public onLoginClicked (goToLogin) {
    this.goToLogin = goToLogin;
    this.closed = false;
  }
  closed:boolean=true;
  public closeSidebar (eve){
      this.goToLogin = false;
      this.closed = true;
  }

  gotoService(){
    let allow = this.authService.isLoggedIn();
  	if (allow === false) {
      let currentUrl = this.router.url;
      this.goToLogin = true;
      this.closed = false;

  	}else{
      this.router.navigateByUrl('services');
    }
    return allow;
  }

 refresh(event){
  this.status = 'loading';
  this.ngOnInit();
 }


  rebuild(event){

    var url_search = window.location.search;
    var urlParams = new URLSearchParams(url_search);
    let action = urlParams.get("action");
    let id = urlParams.get("id");
    this.http.post("/jazz/deployments/"+id+"/re-build",{},id).subscribe(
      (response) => {
        let successMessage = (response.data.message).replace("."," ");
        this.toast_pop('success', "", successMessage+"successfully");
      },
      (error) => {
        let errorMessage = JSON.parse(error._body).message;

        this.toast_pop('error', 'Oops!', errorMessage)
      })
      setTimeout(() => {
        this.status = 'loading';
        this.ngOnInit();
      }, 5000);

  }

  toast_pop(error,oops,errorMessage)
    {
      var tst = document.getElementById('toast-container');
        tst.classList.add('toaster-anim');
        this.toasterService.pop(error,oops,errorMessage);
        setTimeout(() => {
            tst.classList.remove('toaster-anim');
          }, 3000);
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

  status: any = 'loading';

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
        else if(output.data !== undefined && (output.data.status === 'ABORTED') || (output.data.status === 'ALREADY_ABORTED'))
        {
          this.status = 'aborted';
          this.message = output.data.message;
        }
        else{
          this.status = 'success';
          this.message = "Deployment request to production environment is " + this.action + "ed" ;
        }
      },
      (error) => {
        this.status = 'error';
        this.message = "";
      }
    );
  }
}
