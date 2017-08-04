/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, EventEmitter, OnDestroy, Renderer2 } from '@angular/core';
import { MdDatepicker } from './datepicker';
import { AbstractControl, ControlValueAccessor, ValidationErrors, Validator } from '@angular/forms';
import { MdInputContainer } from '../input/input-container';
import { DateAdapter } from '../core/datetime/index';
import { MdDateFormats } from '../core/datetime/date-formats';
export declare const MD_DATEPICKER_VALUE_ACCESSOR: any;
export declare const MD_DATEPICKER_VALIDATORS: any;
/** Directive used to connect an input to a MdDatepicker. */
export declare class MdDatepickerInput<D> implements AfterContentInit, ControlValueAccessor, OnDestroy, Validator {
    private _elementRef;
    private _renderer;
    private _dateAdapter;
    private _dateFormats;
    private _mdInputContainer;
    /** The datepicker that this input is associated with. */
    mdDatepicker: MdDatepicker<D>;
    _datepicker: MdDatepicker<D>;
    matDatepicker: MdDatepicker<D>;
    mdDatepickerFilter: (date: D | null) => boolean;
    _dateFilter: (date: D | null) => boolean;
    matDatepickerFilter: (date: D | null) => boolean;
    /** The value of the input. */
    value: D | null;
    /** The minimum valid date. */
    min: D;
    private _min;
    /** The maximum valid date. */
    max: D;
    private _max;
    /** Emits when the value changes (either due to user input or programmatic change). */
    _valueChange: EventEmitter<D | null>;
    _onTouched: () => void;
    private _cvaOnChange;
    private _validatorOnChange;
    private _datepickerSubscription;
    /** The form control validator for the min date. */
    private _minValidator;
    /** The form control validator for the max date. */
    private _maxValidator;
    /** The form control validator for the date filter. */
    private _filterValidator;
    /** The combined form control validator for this input. */
    private _validator;
    constructor(_elementRef: ElementRef, _renderer: Renderer2, _dateAdapter: DateAdapter<D>, _dateFormats: MdDateFormats, _mdInputContainer: MdInputContainer);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    registerOnValidatorChange(fn: () => void): void;
    validate(c: AbstractControl): ValidationErrors | null;
    /**
     * Gets the element that the datepicker popup should be connected to.
     * @return The element to connect the popup to.
     */
    getPopupConnectionElementRef(): ElementRef;
    writeValue(value: D): void;
    registerOnChange(fn: (value: any) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(disabled: boolean): void;
    _onKeydown(event: KeyboardEvent): void;
    _onInput(value: string): void;
}
