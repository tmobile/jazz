import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DatePickerOptions, DateModel } from './ng2-datepicker';
import * as $ from 'jquery';
import * as moment from 'moment';

const Moment: any = (<any>moment).default || moment;

export interface IDateModel {
  day: string;
  month: string;
  year: string;
  formatted: string;
  momentObj: moment.Moment;
}

@Component({
  selector: 'daterange-picker',
  templateUrl: './daterange-picker.component.html',
  styleUrls: ['./daterange-picker.component.scss']
})

export class DaterangePickerComponent implements OnInit {

	@Input() range: any = {};
	@Input() datePickerOpen: any = {};
  	@Output() onChange:EventEmitter<any> = new EventEmitter<any>();
	@Input() options1: DatePickerOptions;
	@Input() options2: DatePickerOptions;
	@Input() openClose: any = {};

  dateRangeString: string = "";
    showCalendar: boolean;
    forceshowCalendar : boolean;
	momentValue1:any;
	momentValue2:any;

	time1 = {hour:0, minute:0, second:0};
	time2 = {hour:0, minute:0, second:0};

	date1: DateModel;
	date2: DateModel;
	dateModel:DateModel = new DateModel();

	oldDate1:DateModel;
	oldDate2:DateModel;

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

		this.date3 = new Date($(".datepicker-input")[0].innerText);
		this.date4 = new Date($(".datepicker-input")[1].innerText);


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

	ngDoCheck() {
		var olddateComb1 = this.oldDate1.month + '/' + this.oldDate1.day + '/'+ this.oldDate1.year;
		var dateComb1 = this.date1.month + '/' + this.date1.day + '/'+ this.date1.year;
		var olddateComb2 = this.oldDate2.month + '/' + this.oldDate2.day + '/'+ this.oldDate2.year;
		var dateComb2 = this.date2.month + '/' + this.date2.day + '/'+ this.date2.year;
		var todayDate = new Date();

				
		if(this.date1 != undefined && this.oldDate1 != undefined){
			// var oldDate1Formatted = new Date(olddateComb1);
			var date1Formatted = new Date(dateComb1);
			if ( dateComb1 !== olddateComb1 ) {
				this.oldDate1 = this.date1;
			  	this.options2 = new DatePickerOptions({
			  		autoApply : true,
			  		minDate: date1Formatted,
			  		maxDate: todayDate,
			  		format: 'DD-MM-YYYY',
			  	});
			  	console.log("options2 chk ",this.options2);
			}
		}

		if(this.date2 != undefined && this.oldDate2 != undefined){
			// var oldDate2Formatted = new Date(olddateComb2);
			var date2Formatted = new Date(dateComb2);

			if (olddateComb2 !== dateComb2) {
				console.log("dateComb2 chk ",dateComb2);
				console.log("olddateComb2 chk ",olddateComb2);
				this.oldDate2 = this.date2;
				this.options1 = new DatePickerOptions({
					autoApply : true,
			  		format: 'DD-MM-YYYY',
			  		maxDate: date2Formatted
			  	});
			  	console.log("options1 chk ",this.options1);
			}
		}
		

}

  constructor() { 
  	// this.options1 = new DatePickerOptions({
  	// 	autoApply : true,
  	// 	// maxDate: this.date1
  	// });
  	// this.options2 = new DatePickerOptions({
  	// 	autoApply : true,
  	// 	// maxDate: this.date2
  	// });
  }
    public setMoment1(moment1: any): any {
		this.momentValue1 = moment1;
	    // Do whatever you want to the return object 'moment'
	}
    public setMoment2(moment2: any): any {
		this.momentValue2 = moment2;
	    // Do whatever you want to the return object 'moment'
	}

	getTodayDate(){
		var today = new Date();
		var dd = today.getDate();
		var mm = (today.getMonth()+1); //January is 0!

		var yyyy = today.getFullYear().toString();
		// console.log(dd<10);
		if(dd<10){
		    var newdd = '0'+ dd.toString();
		} 
		else{
			var newdd = dd.toString();
		}
		if(mm<10){
		    var newmm = '0'+ mm.toString();
		} 
		else{
			var newmm = mm.toString();
		}
		var newtoday = newmm + '-' + newdd + '-' + yyyy;
		return { fullDate : newtoday, date : newdd, month : newmm, year : yyyy};
	}

  ngOnInit() {

  	var todayDateSring = this.getTodayDate().fullDate;
  	var todayDate = new Date();
  	// console.log("todayDateSring ",todayDateSring);

  	
	let momentObj = moment(todayDateSring, "MM-DD-YYYY");
	this.dateModel.day = this.getTodayDate().date;
	this.dateModel.month = this.getTodayDate().month;
	this.dateModel.year = this.getTodayDate().year;
	this.dateModel.momentObj = momentObj;
	this.dateModel.formatted = momentObj.format();

	this.options1 = new DatePickerOptions({
  		autoApply : true,
  		format: 'DD-MM-YYYY',
  		maxDate: todayDate,
  		initialDate : todayDate
  	});
  	this.options2 = new DatePickerOptions({
  		maxDate: todayDate,
  		format: 'DD-MM-YYYY',
  		initialDate : todayDate
  	});

	this.date1 = this.dateModel;
	this.date2 = this.dateModel;
	// console.log("date1 ",this.date1)

	this.oldDate1 = this.dateModel;
	this.oldDate2 = this.dateModel;

	/********/
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

