import { Component } from '@angular/core';
import {ToasterContainerComponent, ToasterService, ToasterConfig} from 'angular2-toaster';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // directives: [ToasterContainerComponent],
  providers: [ToasterService],
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
	private toasterService: ToasterService;

	constructor(toasterService: ToasterService) {
	  this.toasterService = toasterService;    
	}

	public toasterconfig : ToasterConfig = 
	  new ToasterConfig({
	      showCloseButton: true, 
	      tapToDismiss: false, 
	      timeout: 5000
	  });
}
