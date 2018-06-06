import {Component, OnInit, ViewChild} from '@angular/core';
import {AdminUtilsService} from "../../services/admin-utils.service";

@Component({
  selector: 'admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  @ViewChild('jsonRoot') jsonRoot;
  public adminData;
  public isCollapsed = true;

  constructor(private adminUtils: AdminUtilsService) {
  }

  ngOnInit() {
    this.adminUtils.getExampleVars()
      .then((data: any) => {
        this.adminData = data;
      })
  }


  submit(model) {
    console.log(model);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.jsonRoot.setCollapse(this.isCollapsed);
  }

}
