import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'tmobile-toaster',
  templateUrl: './tmobile-toaster.component.html',
  styleUrls: ['./tmobile-toaster.component.css']
})
export class TmobileToasterComponent implements OnInit {
	toastList:any;

  constructor() { }

  ngOnInit() {
  }

}
