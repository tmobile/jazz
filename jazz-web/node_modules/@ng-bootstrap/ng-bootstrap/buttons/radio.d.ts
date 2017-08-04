import { Renderer2, ElementRef, OnDestroy } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { NgbButtonLabel } from './label';
/**
 * Easily create Bootstrap-style radio buttons. A value of a selected button is bound to a variable
 * specified via ngModel.
 */
export declare class NgbRadioGroup implements ControlValueAccessor {
    private _radios;
    private _value;
    private _disabled;
    disabled: boolean;
    /**
     * The name of the group. Unless enclosed inputs specify a name, this name is used as the name of the
     * enclosed inputs. If not specified, a name is generated automatically.
     */
    name: string;
    onChange: (_: any) => void;
    onTouched: () => void;
    onRadioChange(radio: NgbRadio): void;
    onRadioValueUpdate(): void;
    register(radio: NgbRadio): void;
    registerOnChange(fn: (value: any) => any): void;
    registerOnTouched(fn: () => any): void;
    setDisabledState(isDisabled: boolean): void;
    unregister(radio: NgbRadio): void;
    writeValue(value: any): void;
    private _updateRadiosValue();
    private _updateRadiosDisabled();
}
/**
 * Marks an input of type "radio" as part of the NgbRadioGroup.
 */
export declare class NgbRadio implements OnDestroy {
    private _group;
    private _label;
    private _renderer;
    private _element;
    private _checked;
    private _disabled;
    private _value;
    /**
     * The name of the input. All inputs of a group should have the same name. If not specified,
     * the name of the enclosing group is used.
     */
    name: string;
    /**
     * You can specify model value of a given radio by binding to the value property.
     */
    value: any;
    /**
     * A flag indicating if a given radio button is disabled.
     */
    disabled: boolean;
    focused: boolean;
    readonly checked: boolean;
    readonly nameAttr: string;
    constructor(_group: NgbRadioGroup, _label: NgbButtonLabel, _renderer: Renderer2, _element: ElementRef);
    ngOnDestroy(): void;
    onChange(): void;
    updateValue(value: any): void;
    updateDisabled(): void;
}
