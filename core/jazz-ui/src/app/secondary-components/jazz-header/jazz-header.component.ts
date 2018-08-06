/**
  * @type Component
  * @desc Main Header Component
  * @author
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService, MessageService, RequestService } from '../../core/services/index';
import { ToasterService} from 'angular2-toaster';
import { environment } from './../../../environments/environment';
import { environment as env_oss } from './../../../environments/environment.oss';
import { environment as env_internal } from './../../../environments/environment.internal';



@Component({
    selector: 'jazz-header',
    templateUrl: './jazz-header.component.html',
    providers:[MessageService],
    styleUrls: ['./jazz-header.component.scss']
})
export class JazzHeaderComponent implements OnInit {

    @Input() type: string = 'default';
    @Input() closed: boolean;
    @Input() noLink:boolean;
    @Input() override:boolean = false;
    // @Output() loginClick = new EventEmitter<boolean>();
    @Output() loginClick:EventEmitter<boolean> = new EventEmitter<boolean>();

    selectedTab: string = 'services';
    loading: boolean = false;
    isLoggedIn: boolean;
    isLoginPanelOpen: boolean = false;
    notificationsAvailable: boolean = true;
    profileClicked: boolean = false;
    private toastmessage:any;
    isFeedback:boolean=false;
    private http:any;
    toast:any;
    model:any={
        userFeedback : ''
    };
    isLoading:boolean=false;
    feedbackRes:boolean=false;
    feedbackMsg:string='';
    feedbackResSuccess:boolean=false;
    feedbackResErr:boolean=false;
    // resMessage:string='';
    buttonText:string='SUBMIT';
    loggedinUser:string='';
    overridingUrl:string = "";
    public isAdmin = false;


    public toggleLoginPanel () {
        if(this.closed){
            this.isLoginPanelOpen = false;
        }
        this.isLoginPanelOpen = !this.isLoginPanelOpen;
        this.loginClick.emit(this.isLoginPanelOpen);
    }
    public goToAbout(hash) {
        var top = document.getElementById(hash).offsetTop ;
        scrollTo(top,600);
        return false;
    }

    public goTosselected (link){
        setTimeout(this.goToAbout(link), 10000);
    }

    profileClick(){
        this.profileClicked = !this.profileClicked;
    }
isOSS:boolean=false;
    onNavigate(){
        if(environment.envName=='oss')
        {
            this.isOSS=true;
            window.open(this.docs_oss_jazz)
        }

        else
            window.open(this.docs_int_jazz)

    }
    docs_int_jazz:string =  env_internal.urls.docs;
docs_oss_jazz:string=env_oss.urls.docs_link;

    startUserJourney() {
      return this.router.navigate(['/user-journey']);
    }

    openDocs() {
      window.open(environment.urls['docs_link'], '_blank');
    }

    goToLanding(){
        this.router.navigateByUrl('');// Route to landing page
    }
    openSection(){
        var el = document.getElementById("mobileLinks");
        if(el.offsetHeight == 0)
            el.style.height = "75px";
        else
            el.style.height = "0px";
    }

    logout(){
      localStorage.clear();
      this.loading = true;
      this.authenticationService.logout()
          .subscribe(result => {
              this.loading = false;
              if (result === true) {
                  // Logout successful
                this.isLoggedIn = this.authenticationService.isLoggedIn();
                //Logout success toast message
                // let successMessage  = this.toastmessage.successMessage("true", "logout");
                //   this.toasterService.pop('success', successMessage);
                  this.router.navigateByUrl('');// Route to landing page
              } else {
                  // Logout failed
                  let successMessage  = this.toastmessage.successMessage("false", "logout");
                  this.toasterService.pop('error', successMessage);
              }
          }, error => {
              this.loading = false;
            //   let errorMessage  = this.toastmessage.errorMessage(error,"logout");
            //   this.toasterService.pop('error', 'Oops!', errorMessage);

               //for trmporary period till demo(21 aug '17)
               this.isLoggedIn = this.authenticationService.isLoggedIn();
               this.router.navigateByUrl('');// Route to landing page
          });

    }

    toast_pop(error,oops,errorMessage)
    {
        var tst = document.getElementById('toast-container');

         tst.classList.add('toaster-anim');
        this.toast = this.toasterService.pop(error,oops,errorMessage);
        setTimeout(() => {
            tst.classList.remove('toaster-anim');
          }, 3000);

    }

    preventDefault(e){
        e.preventDefault();
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
        location.href='mailto:'+this.reportEmail+'?subject=Jazz: Feedback/Issue&body=' + this.model.userFeedback;
    }

    submitFeedback(action){
        this.isLoading = true;

        if(action == 'DONE'){
            this.isFeedback=false;
            return;
        }

        var payload={
            "title" : "Jazz: Feedback/Issue reported by "+ this.authenticationService.getUserId(),
            "project_id": env_internal.urls.internal_acronym,
            "priority": "P4",
            "description":this.model.userFeedback,
            "created_by": this.authenticationService.getUserId(),
            "issue_type" :"task"
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
                    // this.resMessage = this.toastmessage.successMessage(response, 'jiraTicket');
                    this.feedbackMsg = "Thanks for taking the time to give us feedback. We’ll use your feedback to improve Jazz experience for everyone!";
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
    //Close override - redirect to login.
    closeOverride(){
        window.stop();
        this.override=false;
        this.overridingUrl=''
        this.authenticationService.logout();
        localStorage.removeItem('overridehost');
        this.router.navigateByUrl('');
        window.location.reload();
    }
    //checks for the override parameters.
    checkUrl(){
        if(this.overridingUrl){
            this.overridingUrl = decodeURIComponent(this.overridingUrl);
            localStorage.setItem('overridehost', 'https://'+this.overridingUrl);
            this.override = true;
            this.authenticationService.logout();
            this.router.navigateByUrl('');
            window.location.reload();
        }else{
            let overridingUrl = localStorage.getItem('overridehost');
            if(overridingUrl){
                this.override = true;
                this.overridingUrl = overridingUrl;
            }
        }
    }

    constructor(
            private route: ActivatedRoute,
            private router: Router,
            private authenticationService: AuthenticationService,
            private toasterService: ToasterService,
            private messageservice: MessageService,
            private request: RequestService
        ) {
            this.isLoginPanelOpen = route.snapshot.data['goToLogin'] || false;
            this.toastmessage = messageservice;
            this.http = request;
        }

    ngOnInit() {
        if(environment.envName=='oss')
        {
            this.isOSS=true;
        }
        // Capture the access token and code
        this.route
        .queryParams
        .subscribe(params => {
            this.overridingUrl = params['apiurl'];
        });

        this.checkUrl();
      this.isLoggedIn = this.authenticationService.isLoggedIn();
      this.loggedinUser =this.isLoggedIn && this.authenticationService.getUserId();
      this.isAdmin = this.isLoggedIn && this.authenticationService.getAuthenticatedUser().globaladmin
    }
}


export function scrollTo(to, duration) {
    var el = document.getElementsByTagName("main")[0];
    if (el.scrollTop == to) return;
    let direction = true;
    if(el.scrollTop > to)
        direction = false;

  let start = el.scrollTop;
  let diff = to - start;
  let scrollStep = Math.PI / (duration / 10);
  let count = 0, currPos = start;


  let scrollInterval = setInterval(function(){

    if (el.scrollTop !== to) {
      let prevVal = diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
      count = count + 1;
      let val = diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
      if((direction && (val - prevVal) < 0) || (!direction && (val - prevVal) > 0))
      {
        el.scrollTop = to;
        clearInterval(scrollInterval);
      }
      else
      {
        currPos = start + diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
        el.scrollTop = currPos;
      }

    } else{
      clearInterval(scrollInterval);
    }
  },10);
};
