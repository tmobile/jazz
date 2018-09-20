import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {CronObject, EventExpression, RateExpression} from "../create-service/service-form-data";
import {CronParserService} from "../../core/helpers";

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
  public cronValidityMessage = '';
  public cronExpressionValid = true;

  constructor(private cronParserService: CronParserService) {
  }

  ngOnInit() {
  }

  changeRateDuration() {
    let expression = this.getCronExpressionFromRate();
    this.setSchedule.emit(expression);
  }

  changeRateInterval(interval) {
    this.rateExpression.interval = interval;
    let expression = this.getCronExpressionFromRate();
    this.setSchedule.emit(expression);
  }

  getCronExpressionFromRate() {
    let interval = this.rateExpression.interval;
    let duration = this.rateExpression.duration;
    let cronObj;
    if (interval == 'Minutes') {
      cronObj = new CronObject(('0/' + duration), '*', '*', '*', '?', '*');
    } else if (interval == 'Hours') {
      cronObj = new CronObject('0', ('0/' + duration), '*', '*', '?', '*');
    } else if (interval == 'Days') {
      cronObj = new CronObject('0', '0', ('1/' + duration), '*', '?', '*');
    }
    let cronExpression = this.cronParserService.getCronExpression(this.cronObj);
    return cronExpression;
  }

  validateCronExpression() {
    let cronValidity = this.cronParserService.validateCron(this.cronObj)
    if (!cronValidity.isValid) {
      this.cronExpressionValid = false;
      if(!cronValidity.minutes) {
        this.cronValidityMessage = 'Minutes field invalid';
      } else if(!cronValidity.hours){
        this.cronValidityMessage = 'Hours field invalid';
      } else if(!cronValidity.dayOfMonth){
        this.cronValidityMessage = 'Day-of-month field invalid';
      } else if(!cronValidity.month){
        this.cronValidityMessage = 'Month field invalid';
      } else if(!cronValidity.dayOfWeek){
        this.cronValidityMessage = 'Day-of-week field invalid';
      } else if(!cronValidity.year){
        this.cronValidityMessage = 'Years field invalid';
      }
    } else {
      let cronExpression = this.cronParserService.getCronExpression(this.cronObj);
      this.setSchedule.emit(cronExpression);
      this.cronExpressionValid = true;
      this.cronValidityMessage = '';
    }
  }

  isExpressionValid() {
    return this.cronExpressionValid;
  }

}
