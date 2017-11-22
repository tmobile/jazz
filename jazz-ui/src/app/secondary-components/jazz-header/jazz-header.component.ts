/**
  * @type Component
  * @desc Main Header Component
  * @author
*/

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService, MessageService } from '../../core/services/index';
import { ToasterService} from 'angular2-toaster';


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
    @Output() loginClick:EventEmitter<boolean> = new EventEmitter<boolean>();

    selectedTab: string = 'services';
    loading: boolean = false;
    isLoggedIn: boolean;
    isLoginPanelOpen: boolean = false;
    notificationsAvailable: boolean = true;
    profileClicked: boolean = false;
    private toastmessage:any;

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

    onNavigate(){
        window.open('https://github.com/tmobile/jazz/wiki')
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
      this.loading = true;
      this.authenticationService.logout()
          .subscribe(result => {
              this.loading = false;
              if (result === true) {
                  // Logout successful
                this.isLoggedIn = this.authenticationService.isLoggedIn();
                  this.router.navigateByUrl('');// Route to landing page
              } else {
                  // Logout failed
                  let successMessage  = this.toastmessage.successMessage("false", "logout");
                  this.toasterService.pop('error', successMessage);
              }
          }, error => {
              this.loading = false;
               this.isLoggedIn = this.authenticationService.isLoggedIn();
               this.router.navigateByUrl('');// Route to landing page
          });

    }

    constructor(
            private route: ActivatedRoute,
            private router: Router,
            private authenticationService: AuthenticationService,
            private toasterService: ToasterService,
            private messageservice: MessageService
        ) {
            this.isLoginPanelOpen = route.snapshot.data['goToLogin'] || false;
            this.toastmessage = messageservice;
        }

    ngOnInit() {
      this.isLoggedIn = this.authenticationService.isLoggedIn();
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
