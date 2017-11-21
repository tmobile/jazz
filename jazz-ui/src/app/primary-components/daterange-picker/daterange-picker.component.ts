import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DatePickerOptions, DateModel } from './ng2-datepicker';
import * as $ from 'jquery';

@Component({
  selector: 'daterange-picker',
  templateUrl: './daterange-picker.component.html',
  styleUrls: ['./daterange-picker.component.scss']
})
// var $:any;

export class DaterangePickerComponent implements OnInit {

	@Input() range: any = {};
  	@Output() onChange:EventEmitter<any> = new EventEmitter<any>();
	@Input() options1: DatePickerOptions;
	@Input() options2: DatePickerOptions;

  dateRangeString: string = "";
    showCalendar: boolean;
	momentValue1:any;
	momentValue2:any;

	time1 = {hour:0, minute:0, second:0};
	time2 = {hour:0, minute:0, second:0};

	date1: DateModel;
	date2: DateModel;

	date3:any;
	date4:any;

	getValidatedValue(value, field){
		if (value == null || value == undefined) {
			value = 0
		}
		var min = 0;
		var max = 1;
		if (field == 'hour') {
			max = 23;
		} else if(field == 'minute' || field == 'second'){
			max = 60;
		}

		if (value < min) {
			value = min;
		}
		if (value > max) {
			value = max;
		}
		return value
	}

	setTime(date, time){
		if (date) {
			date.setHours(time['hour']);
			date.setMinutes(time['minute']);
			date.setSeconds(time['second']);
		}
	}

	ontime1Change(value, field){
		this.time1[field] = this.getValidatedValue(value, field)
		this.setTime(this.momentValue1, this.time1);
	}

	ontime2Change(value, field){
		this.time2[field] = this.getValidatedValue(value, field)
	}

	dateToString(d){
		var date = [d.getFullYear(), d.getMonth(), d.getDate()].join('-');
		var time = [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
		return date + ' ' + time;
	}

	onClear(){
		this.showCalendar = false;
		this.dateRangeString = '';
		this.onChange.emit({from: '', to: ''});
	}
	onApply(){

		this.date3 = new Date($(".datepicker-input")[0].value);
		this.date4 = new Date($(".datepicker-input")[1].value);


		this.setTime(this.date3, this.time1);
		this.setTime(this.date4, this.time2);

		this.onChange.emit({from: this.date3, to: this.date4});


		var from = '', to = '';
		if (this.date3) {
			from = this.dateToString(this.date3)
		}
		if (this.date4) {
			to = this.dateToString(this.date4)
		}
		this.dateRangeString = from + ' - ' + to

		this.showCalendar = false;
		
	}
	onCalender(){
		this.showCalendar = !this.showCalendar;
		
	}

  constructor() { 
  	this.options1 = new DatePickerOptions({
  		autoApply : true,
  	});
  	this.options2 = new DatePickerOptions();
  	// this.showCalendar = false;
  }
    public setMoment1(moment1: any): any {
		this.momentValue1 = moment1;
	    // Do whatever you want to the return object 'moment'
	}
    public setMoment2(moment2: any): any {
		this.momentValue2 = moment2;
	    // Do whatever you want to the return object 'moment'
	}

  ngOnInit() {

  	if (this.range) {
  		// try{
  		// 	this.momentValue1 = new Date(this.range['from']);
  		// } catch(e){
  		// 	this.momentValue1 = new Date();
  		// 	this.momentValue1.setDate(this.momentValue1.getDate() - 1);
				// this.time1 = {hour:this.momentValue1.getHours(), minute:this.momentValue1.getMinutes(), second:this.momentValue1.getSeconds()};
  		// }
  		// try{
  		// 	this.momentValue2 = new Date(this.range['to']);
  		// } catch(e){
  		// 	this.momentValue2 = new Date();
				// this.time2 = {hour:this.momentValue2.getHours(), minute:this.momentValue2.getMinutes(), second:this.momentValue2.getSeconds()};

  		// }
	  }
  }

}

