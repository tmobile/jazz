// /** 
//   * @type Component 
//   * @desc Main Header Component
//   * @author
// */

// import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
// import { Router, ActivatedRoute } from '@angular/router';
// import { AuthenticationService } from '../../core/services/index';
// import { ToasterService} from 'angular2-toaster';


// @Component({
//     selector: 'tmobile-header',
//     templateUrl: './tmobile-header.component.html',
//     styleUrls: ['./tmobile-header.component.scss']
// })
// export class TmobileHeaderComponent implements OnInit {

//     @Input() type: string = 'default';
//     // @Output() loginClick = new EventEmitter<boolean>();
//     @Output() loginClick:EventEmitter<boolean> = new EventEmitter<boolean>();

//     selectedTab: string = 'services';
//     loading: boolean = false;
//     isLoggedIn: boolean;
//     isLoginPanelOpen: boolean = false;
//     notificationsAvailable: boolean = true;
//     profileClicked: boolean = false;

//     public toggleLoginPanel () {
//         this.isLoginPanelOpen = !this.isLoginPanelOpen;
//         this.loginClick.emit(this.isLoginPanelOpen);
//     }
//     public goToAbout(hash){
//         var top = document.getElementById(hash).offsetTop ;
//         scrollTo(top,600);
//         return false;
//     }

//     profileClick(){
//         this.profileClicked = !this.profileClicked;
//     }

 

//     goToLanding(){
//         this.router.navigateByUrl('/landing');
//     }
//     openSection(){
//         var el = document.getElementById("mobileLinks");
//         if(el.offsetHeight == 0)
//             el.style.height = "105px"; 
//         else
//             el.style.height = "0px"; 
//     }

//     logout(){
//       this.loading = true;
//       this.authenticationService.logout()
//           .subscribe(result => {
//               this.loading = false;
//               if (result === true) {
//                   // Logout successful
//                   console.log("Logout success");
//                   this.isLoggedIn = this.authenticationService.isLoggedIn();
//                   this.toasterService.pop('success', 'Logout Successfull', '');
//                   this.router.navigateByUrl('/landing');
//               } else {
//                   // Logout failed
//                   this.toasterService.pop('error', 'Logout Failed', '');
//               }
//           }, error => {
//               console.log("er",error)
//               this.loading = false;
//               if (error !== undefined && error.status !== undefined) {
//                   if (error.status == 0) {
//                       this.toasterService.pop('error', 'Logout Failed', 'Server cannot be reached at the moment');
//                   } else if(error.status == 0){
//                       this.toasterService.pop('error', 'Logout Failed', '');
//                   }
//               } else{
//                   this.toasterService.pop('error', 'Logout Failed', 'Unexpected Error.');
//               }
//           });
          
//     }

//     constructor(
//             private route: ActivatedRoute,
//             private router: Router,
//             private authenticationService: AuthenticationService,
//             private toasterService: ToasterService
//         ) {
//             this.isLoginPanelOpen = route.snapshot.data['goToLogin'] || false;
//         }

//     ngOnInit() {
//       this.isLoggedIn = this.authenticationService.isLoggedIn();

//     }
    

// }


// export function scrollTo(to, duration) {
//     var el = document.getElementsByTagName("main")[0];
//     if (el.scrollTop == to) return;
//     let direction = true;
//     if(el.scrollTop > to)
//         direction = false;

//   let start = el.scrollTop;
//   let diff = to - start;
//   let scrollStep = Math.PI / (duration / 10);
//   let count = 0, currPos = start;
  

//   let scrollInterval = setInterval(function(){
    
//     if (el.scrollTop !== to) {
//       let prevVal = diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
//       count = count + 1;
//       let val = diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
//       if((direction && (val - prevVal) < 0) || (!direction && (val - prevVal) > 0))
//       {
//         el.scrollTop = to;
//         clearInterval(scrollInterval); 
//       }
//       else
//       {
//         currPos = start + diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
//         el.scrollTop = currPos;
//       }
  
//     } else{ 
//       clearInterval(scrollInterval); 
//     }
//   },10);
// };

