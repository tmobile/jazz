import { NgbCalendar, NgbPeriod } from './ngb-calendar';
import { NgbDate } from './ngb-date';
import { NgbMarkDisabled } from './datepicker-view-model';
export declare class NgbDatepickerService {
    private _calendar;
    private _model$;
    private _state;
    readonly model$: any;
    disabled: boolean;
    displayMonths: number;
    firstDayOfWeek: number;
    focusVisible: boolean;
    maxDate: NgbDate;
    markDisabled: NgbMarkDisabled;
    minDate: NgbDate;
    constructor(_calendar: NgbCalendar);
    focus(date: NgbDate): void;
    focusMove(period?: NgbPeriod, number?: number): void;
    focusSelect(): void;
    open(date: NgbDate): void;
    select(date: NgbDate): void;
    toValidDate(date: {
        year: number;
        month: number;
        day?: number;
    }, defaultValue?: NgbDate): NgbDate;
    private _nextState(patch);
    private _patchContexts(state);
    private _updateState(patch);
}
