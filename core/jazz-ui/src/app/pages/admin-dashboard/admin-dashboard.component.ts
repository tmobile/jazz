import {AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {AdminUtilsService} from '../../core/services/admin-utils.service';


@Component({
  selector: 'admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit{

  @ViewChild('jsonRoot') jsonRoot;
  public adminData;
  public isCollapsed = true;
  public state;

  constructor(private adminUtils: AdminUtilsService) {
  }

  ngOnInit() {
    this.state = 'loading';
    this.adminUtils.getJazzConfig()
      .then((data: any) => {
        this.state = 'resolved';
        this.adminData = data;
      })
      .catch((error) => {
        console.log(error);
        this.state = 'error';
      })
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.jsonRoot.setCollapse(this.isCollapsed);
  }

}
