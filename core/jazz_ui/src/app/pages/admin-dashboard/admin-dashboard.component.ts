import {AfterViewChecked, AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {ToasterService} from 'angular2-toaster';
import {AdminUtilsService} from '../../core/services/admin-utils.service';
import {RequestService} from '../../core/services/index';


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
  userData = [];
  check: boolean = false;
  isPUTLoading: boolean = false;
  private http: any;
  loadMore :boolean = false;
  paginationToken:any = '';
  isLoading: boolean = false;

  constructor(private adminUtils: AdminUtilsService,private request: RequestService, private toasterService: ToasterService) {
    this.toasterService = toasterService;
    this.http = request;
  }

  ngOnInit() {
    this.state = 'loading';
    this.adminUtils.getJazzConfig()
      .then((data: any) => {
        this.state = 'resolved';
        this.adminData = data;
        this.getUsers();
      })
      .catch((error) => {
        console.log(error);
        this.state = 'error';
      })
      this.getUsers();
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.jsonRoot.setCollapse(this.isCollapsed);
  }
  getUsers() {
    this.state = 'loading';
    this.adminUtils.getAdminUsers(this.paginationToken)
      .then((data: any) => {
        this.state = 'resolved';
        this.userData = this.userData.concat(data.users);
        if (data.paginationtoken) {
          this.loadMore = true;
          this.paginationToken = encodeURIComponent(data.paginationtoken);
        }
        else {
          this.loadMore = false;
          this.paginationToken = '';
        }
      })
      .catch((error) => {
        console.log(error);
        this.state = 'error';
      })
  }

  checkValue(event, name) {
    let payload = {};
    this.check = !event;
    if (this.check == false) {
      payload['status'] = 0;
    }
    else {
      payload['status'] = 1;
    }
    this.isPUTLoading = true;
    this.isLoading = true;
    this.http.put('/jazz/usermanagement/' + name, payload)
      .subscribe(
        (Response) => {
          this.isPUTLoading = false;
          this.isLoading = false
          this.getAdminUsers();
          var tst = document.getElementById('toast-container');
          tst.classList.add('toaster-anim');
          this.toasterService.pop('Sucess', Response.data.message);
          setTimeout(() => {
            tst.classList.remove('toaster-anim');
          }, 3000);

        },
        (Error) => {

          this.isPUTLoading = false;

        });
  }
  getAdminUsers() {
    this.state = 'loading';
    this.paginationToken = '';
    this.userData = [];
    this.adminUtils.getAdminUsers(this.paginationToken)
      .then((data: any) => {
        this.state = 'resolved';
        this.userData = data.users;
        this.loadMore = true;
        this.paginationToken = '';
        if (data.paginationtoken) {

          this.paginationToken = encodeURIComponent(data.paginationtoken);
        }
        else {
          this.loadMore = false;
          this.paginationToken = '';
        }
      })
      .catch((error) => {
        console.log(error);
        this.state = 'error';
      })
  }
  showMore() {
    this.getUsers();
  }
}
