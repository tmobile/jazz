import { NgbDatepickerService } from './datepicker-service';
import { NgbCalendar } from './ngb-calendar';
export declare class NgbDatepickerKeyMapService {
    private _service;
    private _calendar;
    private _minDate;
    private _maxDate;
    private _firstViewDate;
    private _lastViewDate;
    constructor(_service: NgbDatepickerService, _calendar: NgbCalendar);
    processKey(event: KeyboardEvent): void;
}
