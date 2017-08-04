import { NgbDate } from './ngb-date';
import { NgbDateStruct } from './ngb-date-struct';
import { DayTemplateContext } from './datepicker-day-template-context';
export declare type NgbMarkDisabled = (date: NgbDateStruct, current: {
    year: number;
    month: number;
}) => boolean;
export declare type DayViewModel = {
    date: NgbDate;
    context: DayTemplateContext;
};
export declare type WeekViewModel = {
    number: number;
    days: DayViewModel[];
};
export declare type MonthViewModel = {
    firstDate: NgbDate;
    lastDate: NgbDate;
    number: number;
    year: number;
    weeks: WeekViewModel[];
    weekdays: number[];
};
export declare type DatepickerViewModel = {
    disabled: boolean;
    displayMonths: number;
    firstDate?: NgbDate;
    firstDayOfWeek: number;
    focusDate?: NgbDate;
    focusVisible: boolean;
    lastDate?: NgbDate;
    markDisabled?: NgbMarkDisabled;
    maxDate?: NgbDate;
    minDate?: NgbDate;
    months: MonthViewModel[];
    selectedDate: NgbDate;
};
export declare enum NavigationEvent {
    PREV = 0,
    NEXT = 1,
}
