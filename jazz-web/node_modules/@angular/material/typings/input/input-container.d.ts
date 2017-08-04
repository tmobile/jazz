/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, AfterContentChecked, AfterViewInit, ChangeDetectorRef, ElementRef, EventEmitter, QueryList, Renderer2 } from '@angular/core';
import { Platform } from '../core';
import { FormGroupDirective, NgControl, NgForm } from '@angular/forms';
import { FloatPlaceholderType, PlaceholderOptions } from '../core/placeholder/placeholder-options';
import { ErrorStateMatcher, ErrorOptions } from '../core/error/error-options';
/**
 * The placeholder directive. The content can declare this to implement more
 * complex placeholders.
 */
export declare class MdPlaceholder {
}
/** Hint text to be shown underneath the input. */
export declare class MdHint {
    /** Whether to align the hint label at the start or end of the line. */
    align: 'start' | 'end';
    /** Unique ID for the hint. Used for the aria-describedby on the input. */
    id: string;
}
/** Single error message to be shown underneath the input. */
export declare class MdErrorDirective {
}
/** Prefix to be placed the the front of the input. */
export declare class MdPrefix {
}
/** Suffix to be placed at the end of the input. */
export declare class MdSuffix {
}
/** Marker for the input element that `MdInputContainer` is wrapping. */
export declare class MdInputDirective {
    private _elementRef;
    private _renderer;
    private _platform;
    _ngControl: NgControl;
    private _parentForm;
    private _parentFormGroup;
    /** Variables used as cache for getters and setters. */
    private _type;
    private _placeholder;
    private _disabled;
    private _required;
    private _id;
    private _cachedUid;
    private _errorOptions;
    /** Whether the element is focused or not. */
    focused: boolean;
    /** Sets the aria-describedby attribute on the input for improved a11y. */
    ariaDescribedby: string;
    /** Whether the element is disabled. */
    disabled: any;
    /** Unique id of the element. */
    id: string;
    /** Placeholder attribute of the element. */
    placeholder: string;
    /** Whether the element is required. */
    required: any;
    /** Input type of the element. */
    type: string;
    /** A function used to control when error messages are shown. */
    errorStateMatcher: ErrorStateMatcher;
    /** The input element's value. */
    value: string;
    /**
     * Emits an event when the placeholder changes so that the `md-input-container` can re-validate.
     */
    _placeholderChange: EventEmitter<string>;
    /** Whether the input is empty. */
    readonly empty: boolean;
    private readonly _uid;
    private _neverEmptyInputTypes;
    constructor(_elementRef: ElementRef, _renderer: Renderer2, _platform: Platform, _ngControl: NgControl, _parentForm: NgForm, _parentFormGroup: FormGroupDirective, errorOptions: ErrorOptions);
    /** Focuses the input element. */
    focus(): void;
    _onFocus(): void;
    _onBlur(): void;
    _onInput(): void;
    /** Whether the input is in an error state. */
    _isErrorState(): boolean;
    /** Make sure the input is a supported type. */
    private _validateType();
    private _isNeverEmpty();
    private _isBadInput();
    /** Determines if the component host is a textarea. If not recognizable it returns false. */
    private _isTextarea();
}
/**
 * Container for text inputs that applies Material Design styling and behavior.
 */
export declare class MdInputContainer implements AfterViewInit, AfterContentInit, AfterContentChecked {
    _elementRef: ElementRef;
    private _changeDetectorRef;
    private _placeholderOptions;
    /** Color of the input divider, based on the theme. */
    color: 'primary' | 'accent' | 'warn';
    /** @deprecated Use color instead. */
    dividerColor: "primary" | "accent" | "warn";
    /** Whether the required marker should be hidden. */
    hideRequiredMarker: any;
    private _hideRequiredMarker;
    /** Whether the floating label should always float or not. */
    readonly _shouldAlwaysFloat: boolean;
    /** Whether the placeholder can float or not. */
    readonly _canPlaceholderFloat: boolean;
    /** State of the md-hint and md-error animations. */
    _subscriptAnimationState: string;
    /** Text for the input hint. */
    hintLabel: string;
    private _hintLabel;
    _hintLabelId: string;
    /** Whether the placeholder should always float, never float or float as the user types. */
    floatPlaceholder: FloatPlaceholderType;
    private _floatPlaceholder;
    /** Reference to the input's underline element. */
    underlineRef: ElementRef;
    _mdInputChild: MdInputDirective;
    _placeholderChild: MdPlaceholder;
    _errorChildren: QueryList<MdErrorDirective>;
    _hintChildren: QueryList<MdHint>;
    _prefixChildren: QueryList<MdPrefix>;
    _suffixChildren: QueryList<MdSuffix>;
    constructor(_elementRef: ElementRef, _changeDetectorRef: ChangeDetectorRef, placeholderOptions: PlaceholderOptions);
    ngAfterContentInit(): void;
    ngAfterContentChecked(): void;
    ngAfterViewInit(): void;
    /** Determines whether a class from the NgControl should be forwarded to the host element. */
    _shouldForward(prop: string): boolean;
    /** Whether the input has a placeholder. */
    _hasPlaceholder(): boolean;
    /** Focuses the underlying input. */
    _focusInput(): void;
    /** Determines whether to display hints or errors. */
    _getDisplayedMessages(): 'error' | 'hint';
    /**
     * Ensure that there is only one placeholder (either `input` attribute or child element with the
     * `md-placeholder` attribute.
     */
    private _validatePlaceholders();
    /**
     * Does any extra processing that is required when handling the hints.
     */
    private _processHints();
    /**
     * Ensure that there is a maximum of one of each `<md-hint>` alignment specified, with the
     * attribute being considered as `align="start"`.
     */
    private _validateHints();
    /**
     * Sets the child input's `aria-describedby` to a space-separated list of the ids
     * of the currently-specified hints, as well as a generated id for the hint label.
     */
    private _syncAriaDescribedby();
    /**
     * Throws an error if the container's input child was removed.
     */
    private _validateInputChild();
}
