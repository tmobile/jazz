
import { Component } from '@angular/core';
import {ToasterContainerComponent, ToasterService, ToasterConfig} from 'angular2-toaster';
import {Idle, DEFAULT_INTERRUPTSOURCES} from '@ng-idle/core';
import {Keepalive} from '@ng-idle/keepalive';
import { AuthenticationService, MessageService } from './core/services/index';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import {BodyOutputType} from 'angular2-toaster';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [ToasterService, MessageService],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
	idleState = 'Not started.';
  timedOut = false;
  lastPing?: Date = null;
	public wrapperClass = '';
	tst:any;

	constructor(
		private toasterService: ToasterService,
		private idle: Idle,
		private location: Location,
		private keepalive: Keepalive,private router: Router,
		private messageservice:MessageService,
		private authenticationservice:AuthenticationService
	) {
	
		// sets an idle timeout of 15 mins, for testing purposes.
    idle.setIdle(60*15);
    // sets a timeout period of 15 mins. after 30 mins of inactivity, the user will be considered timed out.
    idle.setTimeout(60*15);
    // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onTimeout.subscribe(() => {
			if(this.authenticationservice.isLoggedIn()){
				this.authenticationservice.logout();
				this.router.navigate(['']);//location.path routed to landing page
				let msg = this.messageservice.sessionEnd("true");
				this.toasterService.pop('error','Oops!',msg);
			}
			
      this.idleState = 'Timed out!';
			this.timedOut = true;
			this.reset();
    });

		this.reset();
		//location.path routed to landing page
    if (location.path() == '') {
      this.wrapperClass = 'landing';
    }
	  this.toasterService = toasterService;    
	}
	reset() {
    this.idle.watch();
    this.idleState = 'Started.';
    this.timedOut = false;
  }

	public toasterconfig : ToasterConfig = 
	  new ToasterConfig({
	      showCloseButton: true, 
	      tapToDismiss: false, 
				timeout: 4000,
				limit:1
				
	  });
}
