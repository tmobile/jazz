import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'error403',
  templateUrl: './error403.component.html',
  styleUrls: ['./error403.component.scss']
})
export class Error403Component implements OnInit {

  constructor(
    private router: Router){
}

  ngOnInit() {

  }
  backToServices() {
    this.router.navigateByUrl('/services');
  }
}
