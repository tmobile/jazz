import { Component, OnInit } from '@angular/core';
import {AdminUtilsService} from "../../services/admin-utils.service";

@Component({
  selector: 'admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  public adminData;

  constructor(private adminUtils: AdminUtilsService) { }

  ngOnInit() {
    this.adminUtils.getExampleVars()
      .then((data: any) =>{
        this.adminData = data;
      })
  }

}
