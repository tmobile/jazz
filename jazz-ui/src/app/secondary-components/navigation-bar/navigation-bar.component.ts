/** 
  * @type Component 
  * @desc Navigation bar (breadcrumbs)
  * @author
*/


import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'navigation-bar',
  templateUrl: './navigation-bar.component.html',
  styleUrls: ['./navigation-bar.component.scss']
})
export class NavigationBarComponent implements OnInit {

  @Input() links;
  @Input() data;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
  }

  public goToLink(link){
    this.router.navigateByUrl(link);
  }

}
