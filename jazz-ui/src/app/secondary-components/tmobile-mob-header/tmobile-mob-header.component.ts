import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'tmobile-mob-header',
  templateUrl: './tmobile-mob-header.component.html',
  styleUrls: ['./tmobile-mob-header.component.scss']
})
export class TmobileMobHeaderComponent implements OnInit {
  profileClicked: boolean=false;
  isLoginPanelOpen: boolean = false;
  isLoggedIn:boolean;

	@Input() headText: string ;
	@Input() status: string ;
	@Input() icon: string ;	
  @Input() hideBack: boolean;
	@Output() addClick:EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() backClick:EventEmitter<boolean> = new EventEmitter<boolean>();

  // constructor() { }

  ngOnInit() {
    
  }

  createServiceEmit(){
  	this.addClick.emit();
  }

  genericBack(){
  	this.backClick.emit();
  }
  profileClick(){
        this.profileClicked = !this.profileClicked;
  }

}
