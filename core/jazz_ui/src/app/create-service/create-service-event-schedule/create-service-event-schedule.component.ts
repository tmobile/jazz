import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CronObject, EventExpression, RateExpression} from "../create-service/service-form-data";

@Component({
  selector: 'create-service-event-schedule',
  templateUrl: './create-service-event-schedule.component.html',
  styleUrls: ['./create-service-event-schedule.component.scss']
})
export class CreateServiceEventScheduleComponent implements OnInit {
  @Output() setSchedule = new EventEmitter();
  @Input() type = "none";
  public rateData = ['Minutes', 'Hours', 'Days'];

  public rateExpression = new RateExpression(undefined, undefined, 'none', '5', 'Minutes', '');
  public cronObj = new CronObject('0/5', '*', '*', '*', '?', '*');
  constructor() { }

  ngOnInit() {
  }

  changeRateInterval(interval) {
    this.rateExpression.interval = interval;
  }


}
