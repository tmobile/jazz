import { MdDatepicker } from './datepicker';
import { MdDatepickerIntl } from './datepicker-intl';
export declare class MdDatepickerToggle<D> {
    _intl: MdDatepickerIntl;
    /** Datepicker instance that the button will toggle. */
    datepicker: MdDatepicker<D>;
    _datepicker: MdDatepicker<D>;
    constructor(_intl: MdDatepickerIntl);
    _open(event: Event): void;
}
