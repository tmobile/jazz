import { TemplateRef, EventEmitter } from '@angular/core';
import { MonthViewModel, DayViewModel, WeekViewModel } from './datepicker-view-model';
import { NgbDate } from './ngb-date';
import { NgbDatepickerI18n } from './datepicker-i18n';
import { DayTemplateContext } from './datepicker-day-template-context';
export declare class NgbDatepickerMonthView {
    i18n: NgbDatepickerI18n;
    dayTemplate: TemplateRef<DayTemplateContext>;
    month: MonthViewModel;
    outsideDays: 'visible' | 'hidden' | 'collapsed';
    showWeekdays: any;
    showWeekNumbers: any;
    select: EventEmitter<NgbDate>;
    constructor(i18n: NgbDatepickerI18n);
    doSelect(day: DayViewModel): void;
    isCollapsed(week: WeekViewModel): boolean;
    isHidden(day: DayViewModel): boolean;
}
