/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ChangeDetectorRef, ElementRef, EventEmitter, OnDestroy, Renderer2 } from '@angular/core';
import { FocusOriginMonitor, HammerInput, MdRipple, Platform } from '../core';
import { ControlValueAccessor } from '@angular/forms';
import { CanDisable } from '../core/common-behaviors/disabled';
import { CanColor } from '../core/common-behaviors/color';
export declare const MD_SLIDE_TOGGLE_VALUE_ACCESSOR: any;
export declare class MdSlideToggleChange {
    source: MdSlideToggle;
    checked: boolean;
}
/** @docs-private */
export declare class MdSlideToggleBase {
    _renderer: Renderer2;
    _elementRef: ElementRef;
    constructor(_renderer: Renderer2, _elementRef: ElementRef);
}
export declare const _MdSlideToggleMixinBase: (new (...args: any[]) => CanColor) & (new (...args: any[]) => CanDisable) & typeof MdSlideToggleBase;
/** Represents a slidable "switch" toggle that can be moved between on and off. */
export declare class MdSlideToggle extends _MdSlideToggleMixinBase implements OnDestroy, AfterContentInit, ControlValueAccessor, CanDisable, CanColor {
    private _platform;
    private _focusOriginMonitor;
    private _changeDetectorRef;
    private onChange;
    private onTouched;
    private _uniqueId;
    private _checked;
    private _slideRenderer;
    private _required;
    private _disableRipple;
    /** Reference to the focus state ripple. */
    private _focusRipple;
    /** Name value will be applied to the input element if present */
    name: string | null;
    /** A unique id for the slide-toggle input. If none is supplied, it will be auto-generated. */
    id: string;
    /** Used to specify the tabIndex value for the underlying input element. */
    tabIndex: number;
    /** Whether the label should appear after or before the slide-toggle. Defaults to 'after' */
    labelPosition: 'before' | 'after';
    /** Used to set the aria-label attribute on the underlying input element. */
    ariaLabel: string | null;
    /** Used to set the aria-labelledby attribute on the underlying input element. */
    ariaLabelledby: string | null;
    /** Whether the slide-toggle is required. */
    required: boolean;
    /** Whether the ripple effect for this slide-toggle is disabled. */
    disableRipple: boolean;
    /** An event will be dispatched each time the slide-toggle changes its value. */
    change: EventEmitter<MdSlideToggleChange>;
    /** Returns the unique id for the visual hidden input. */
    readonly inputId: string;
    /** Reference to the underlying input element. */
    _inputElement: ElementRef;
    /** Reference to the ripple directive on the thumb container. */
    _ripple: MdRipple;
    constructor(elementRef: ElementRef, renderer: Renderer2, _platform: Platform, _focusOriginMonitor: FocusOriginMonitor, _changeDetectorRef: ChangeDetectorRef);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /**
     * The onChangeEvent method will be also called on click.
     * This is because everything for the slide-toggle is wrapped inside of a label,
     * which triggers a onChange event on click.
     */
    _onChangeEvent(event: Event): void;
    _onInputClick(event: Event): void;
    /** Implemented as part of ControlValueAccessor. */
    writeValue(value: any): void;
    /** Implemented as part of ControlValueAccessor. */
    registerOnChange(fn: any): void;
    /** Implemented as part of ControlValueAccessor. */
    registerOnTouched(fn: any): void;
    /** Implemented as a part of ControlValueAccessor. */
    setDisabledState(isDisabled: boolean): void;
    /** Focuses the slide-toggle. */
    focus(): void;
    /** Whether the slide-toggle is checked. */
    checked: boolean;
    /** Toggles the checked state of the slide-toggle. */
    toggle(): void;
    /** Function is called whenever the focus changes for the input element. */
    private _onInputFocusChange(focusOrigin);
    /** Emits the change event to the `change` output EventEmitter */
    private _emitChangeEvent();
    _onDragStart(): void;
    _onDrag(event: HammerInput): void;
    _onDragEnd(): void;
}
