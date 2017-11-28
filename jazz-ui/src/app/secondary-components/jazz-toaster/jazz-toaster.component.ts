import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'jazz-toaster',
  templateUrl: './jazz-toaster.component.html',
  styleUrls: ['./jazz-toaster.component.css']
})
export class JazzToasterComponent implements OnInit {
	toastList:any;

  constructor() { }

  ngOnInit() {
  }

}
