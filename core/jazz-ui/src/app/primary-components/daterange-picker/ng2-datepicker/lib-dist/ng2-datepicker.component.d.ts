import { ElementRef, OnInit, EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { SlimScrollOptions } from '../../ng2-slimscroll';
import * as moment from 'moment';
export interface IDateModel {
    day: string;
    month: string;
    year: string;
    formatted: string;
    momentObj: moment.Moment;
}
export declare class DateModel {
    day: string;
    month: string;
    year: string;
    formatted: string;
    momentObj: moment.Moment;
    constructor(obj?: IDateModel);
}
export interface IDatePickerOptions {
    autoApply?: boolean;
    style?: 'normal' | 'big' | 'bold';
    locale?: string;
    minDate?: Date;
    maxDate?: Date;
    initialDate?: Date;
    firstWeekdaySunday?: boolean;
    format?: string;
    selectYearText?: string;
    todayText?: string;
    clearText?: string;
}
export declare class DatePickerOptions {
    autoApply?: boolean;
    style?: 'normal' | 'big' | 'bold';
    locale?: string;
    minDate?: Date;
    maxDate?: Date;
    initialDate?: Date;
    firstWeekdaySunday?: boolean;
    format?: string;
    selectYearText?: string;
    todayText?: string;
    clearText?: string;
    constructor(obj?: IDatePickerOptions);
}
export interface CalendarDate {
    day: number;
    month: number;
    year: number;
    enabled: boolean;
    today: boolean;
    selected: boolean;
    momentObj: moment.Moment;
}
export declare const CALENDAR_VALUE_ACCESSOR: any;
export declare class DatePickerComponent implements ControlValueAccessor, OnInit {
    el: ElementRef;
    options: DatePickerOptions;
    inputEvents: EventEmitter<{
        type: string;
        data: string | DateModel;
    }>;
    outputEvents: EventEmitter<{
        type: string;
        data: string | DateModel;
    }>;
    date: DateModel;
    opened: boolean;
    currentDate: moment.Moment;
    days: CalendarDate[];
    years: number[];
    yearPicker: boolean;
    scrollOptions: SlimScrollOptions;
    minDate: moment.Moment | any;
    maxDate: moment.Moment | any;
    private onTouchedCallback;
    private onChangeCallback;
    constructor(el: ElementRef);
    value: DateModel;
    ngOnInit(): void;
    generateCalendar(): void;
    selectDate(e: MouseEvent, date: moment.Moment): void;
    selectYear(e: MouseEvent, year: number): void;
    generateYears(): void;
    writeValue(date: DateModel): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    prevMonth(): void;
    nextMonth(): void;
    today(): void;
    toggle(): void;
    open(): void;
    close(): void;
    onOpen(): void;
    openYearPicker(): void;
    clear(): void;
}
