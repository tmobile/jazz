import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TmobileHeaderComponent } from '../tmobile-header/tmobile-header.component'
import {DataCacheService } from '../../core/services/index';

@Component({
  selector: 'footer',
  templateUrl: './footer.component.html',
  providers:[TmobileHeaderComponent],
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

  constructor( private router:Router,
 private cache: DataCacheService,
  private tmobileHeader:TmobileHeaderComponent) { }
  
 public goToAbout(hash){
    this.router.navigateByUrl('landing');
    this.cache.set('scroll_flag',true);
    this.cache.set('scroll_id',hash);
 }

  ngOnInit() {
  }

}
 