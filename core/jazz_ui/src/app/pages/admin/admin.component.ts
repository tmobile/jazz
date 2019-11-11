import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  mobSecState: number;
  mobTabData: any;

  constructor() { }

  ngOnInit() {
  }

  public changeActivity(data){
    this.mobSecState = data;
  }

}
