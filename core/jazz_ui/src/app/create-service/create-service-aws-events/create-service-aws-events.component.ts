import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'create-service-aws-events',
  templateUrl: './create-service-aws-events.component.html',
  styleUrls: ['./create-service-aws-events.component.scss']
})
export class CreateServiceAwsEventsComponent implements OnInit {
  @Input() type = 'awsEventsNone';

  constructor() { }

  ngOnInit() {
  }

}
