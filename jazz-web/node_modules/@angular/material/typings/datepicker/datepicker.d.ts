/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, EventEmitter, OnDestroy, ViewContainerRef, NgZone } from '@angular/core';
import { Overlay } from '../core/overlay/overlay';
import { Directionality } from '../core/bidi/index';
import { MdDialog } from '../dialog/dialog';
import { MdDatepickerInput } from './datepicker-input';
import { DateAdapter } from '../core/datetime/index';
import { MdCalendar } from './calendar';
/**
 * Component used as the content for the datepicker dialog and popup. We use this instead of using
 * MdCalendar directly as the content so we can control the initial focus. This also gives us a
 * place to put additional features of the popup that are not part of the calendar itself in the
 * future. (e.g. confirmation buttons).
 * @docs-private
 */
export declare class MdDatepickerContent<D> implements AfterContentInit {
    datepicker: MdDatepicker<D>;
    _calendar: MdCalendar<D>;
    ngAfterContentInit(): void;
    /**
     * Handles keydown event on datepicker content.
     * @param event The event.
     */
    _handleKeydown(event: KeyboardEvent): void;
}
/** Component responsible for managing the datepicker popup/dialog. */
export declare class MdDatepicker<D> implements OnDestroy {
    private _dialog;
    private _overlay;
    private _ngZone;
    private _viewContainerRef;
    private _dateAdapter;
    private _dir;
    private _document;
    /** The date to open the calendar to initially. */
    startAt: D;
    private _startAt;
    /** The view that the calendar should start in. */
    startView: 'month' | 'year';
    /**
     * Whether the calendar UI is in touch mode. In touch mode the calendar opens in a dialog rather
     * than a popup and elements have more padding to allow for bigger touch targets.
     */
    touchUi: boolean;
    /** Emits new selected date when selected date changes. */
    selectedChanged: EventEmitter<D>;
    /** Whether the calendar is open. */
    opened: boolean;
    /** The id for the datepicker calendar. */
    id: string;
    /** The currently selected date. */
    _selected: D | null;
    /** The minimum selectable date. */
    readonly _minDate: D;
    /** The maximum selectable date. */
    readonly _maxDate: D;
    readonly _dateFilter: (date: D | null) => boolean;
    /** A reference to the overlay when the calendar is opened as a popup. */
    private _popupRef;
    /** A reference to the dialog when the calendar is opened as a dialog. */
    private _dialogRef;
    /** A portal containing the calendar for this datepicker. */
    private _calendarPortal;
    /** The input element this datepicker is associated with. */
    private _datepickerInput;
    /** The element that was focused before the datepicker was opened. */
    private _focusedElementBeforeOpen;
    private _inputSubscription;
    constructor(_dialog: MdDialog, _overlay: Overlay, _ngZone: NgZone, _viewContainerRef: ViewContainerRef, _dateAdapter: DateAdapter<D>, _dir: Directionality, _document: any);
    ngOnDestroy(): void;
    /** Selects the given date and closes the currently open popup or dialog. */
    _selectAndClose(date: D): void;
    /**
     * Register an input with this datepicker.
     * @param input The datepicker input to register with this datepicker.
     */
    _registerInput(input: MdDatepickerInput<D>): void;
    /** Open the calendar. */
    open(): void;
    /** Close the calendar. */
    close(): void;
    /** Open the calendar as a dialog. */
    private _openAsDialog();
    /** Open the calendar as a popup. */
    private _openAsPopup();
    /** Create the popup. */
    private _createPopup();
    /** Create the popup PositionStrategy. */
    private _createPopupPositionStrategy();
}
