import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { JazzHeaderComponent } from '../jazz-header/jazz-header.component'
import { DataCacheService } from '../../core/services/index';
import { environment } from './../../../environments/environment';
import { environment as env_oss } from './../../../environments/environment.oss';

import {environment as env_internal} from './../../../environments/environment.internal';



@Component({
  selector: 'footer',
  templateUrl: './footer.component.html',
  providers:[JazzHeaderComponent],
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor( private router:Router,
 private cache: DataCacheService,
  private jazzHeader:JazzHeaderComponent) { }
  
 public goToAbout(hash){
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag',true);
    this.cache.set('scroll_id',hash);
 }
docs_url:string = '';
isOSS:boolean=false;
docs_int_jazz:string = env_internal.urls.docs;
docs_oss_jazz:string= env_oss.urls.docs_link;
  ngOnInit() {
    if(environment.envName=="oss"){
      this.isOSS=true;
      this.docs_url= this.docs_oss_jazz;
    }
    else this.docs_url= this.docs_int_jazz;

  }

}
 