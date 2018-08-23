/** 
  * @type Component 
  * @desc Overlay component, slides in from right
  * @author
*/

import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

    @Input() show: boolean;
    @Input() closeClick: boolean=true;
    @Output() loginClick:EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() onClose:EventEmitter<boolean> = new EventEmitter<boolean>();

    public closeOverlay () {
    	if (this.closeClick == true) {
          this.onClose.emit(false);
    	}
    }
    stopPropagation(event) {
	    event.stopPropagation();
	}

  public goToLogin (goToLogin) {
        this.loginClick.emit(goToLogin);
    }

	constructor(
	) { }

	ngOnInit() {
	}

}
