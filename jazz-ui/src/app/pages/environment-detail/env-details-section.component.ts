import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'env-details-section',
  templateUrl: './env-details-section.component.html',
  styleUrls: ['./env-details-section.component.scss']
})
export class EnvDetailsSectionComponent implements OnInit {

  @Input() service: any = {};
  constructor() { }

  ngOnInit() {
  }

}
