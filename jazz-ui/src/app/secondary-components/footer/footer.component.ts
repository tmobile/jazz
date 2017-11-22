import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { JazzHeaderComponent } from '../jazz-header/jazz-header.component'
import {DataCacheService } from '../../core/services/index';

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

  ngOnInit() {
  }

}
 