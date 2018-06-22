import { Component, OnInit } from '@angular/core';
import { RequestService, DataCacheService, MessageService } from '../../core/services';
import { Router, ActivatedRoute, Params } from '@angular/router';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { ToasterService} from 'angular2-toaster';

@Component({
  selector: 'error404',
  templateUrl: './error404.component.html',
  styleUrls: ['./error404.component.scss']
})


export class Error404Component implements OnInit {

  constructor(
    private http: RequestService,
    private cache: DataCacheService,
    private router: Router,
  private activatedroute : ActivatedRoute,
private toasterService:ToasterService,
private messageservice: MessageService) {
  this.toastmessage =messageservice;
}

  goToLogin:boolean = false;
  closed:boolean=true;
  noLink:boolean = true;
  toastmessage:any;
  errorTxt:any;
  errorHdr:any;

    backtohome() {
        this.router.navigateByUrl('');
    }

    public onLoginClicked (goToLogin) {
      this.goToLogin = goToLogin;
      this.closed = false;
  }
  
  public closeSidebar (eve){
      this.goToLogin = false;
      this.closed = true;
  }
    public goToAbout(hash){
      this.router.navigateByUrl('landing');
      this.cache.set('scroll_flag', true);
      this.cache.set('scroll_id', hash);
   }

  ngOnInit() {
    this.errorTxt  = this.toastmessage.customMessage('errorTxt', 'error404');
    this.errorHdr = this.toastmessage.customMessage('errorHdr', 'error404')
  }
}
