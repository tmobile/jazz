import { ControlValueAccessor } from '@angular/forms';
import { NgbButtonLabel } from './label';
/**
 * Easily create Bootstrap-style checkbox buttons. A value of a checked button is bound to a variable
 * specified via ngModel.
 */
export declare class NgbCheckBox implements ControlValueAccessor {
    private _label;
    checked: any;
    /**
     * A flag indicating if a given checkbox button is disabled.
     */
    disabled: boolean;
    /**
     * Value to be propagated as model when the checkbox is checked.
     */
    valueChecked: boolean;
    /**
     * Value to be propagated as model when the checkbox is unchecked.
     */
    valueUnChecked: boolean;
    onChange: (_: any) => void;
    onTouched: () => void;
    focused: boolean;
    constructor(_label: NgbButtonLabel);
    onInputChange($event: any): void;
    registerOnChange(fn: (value: any) => any): void;
    registerOnTouched(fn: () => any): void;
    setDisabledState(isDisabled: boolean): void;
    writeValue(value: any): void;
}
