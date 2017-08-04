/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, QueryList, EventEmitter, Renderer2, NgZone, OnDestroy } from '@angular/core';
import { Directionality } from '../core';
import { FocusTrapFactory } from '../core/a11y/focus-trap';
/** Throws an exception when two MdSidenav are matching the same side. */
export declare function throwMdDuplicatedSidenavError(align: string): void;
/** Sidenav toggle promise result. */
export declare class MdSidenavToggleResult {
    type: 'open' | 'close';
    animationFinished: boolean;
    constructor(type: 'open' | 'close', animationFinished: boolean);
}
/**
 * <md-sidenav> component.
 *
 * This component corresponds to the drawer of the sidenav.
 *
 * Please refer to README.md for examples on how to use it.
 */
export declare class MdSidenav implements AfterContentInit, OnDestroy {
    private _elementRef;
    private _focusTrapFactory;
    private _doc;
    private _focusTrap;
    /** Alignment of the sidenav (direction neutral); whether 'start' or 'end'. */
    private _align;
    /** Direction which the sidenav is aligned in. */
    align: "start" | "end";
    /** Mode of the sidenav; one of 'over', 'push' or 'side'. */
    mode: 'over' | 'push' | 'side';
    /** Whether the sidenav can be closed with the escape key or not. */
    disableClose: boolean;
    private _disableClose;
    /** Whether the sidenav is opened. */
    _opened: boolean;
    /** Event emitted when the sidenav is being opened. Use this to synchronize animations. */
    onOpenStart: EventEmitter<void>;
    /** Event emitted when the sidenav is fully opened. */
    onOpen: EventEmitter<void>;
    /** Event emitted when the sidenav is being closed. Use this to synchronize animations. */
    onCloseStart: EventEmitter<void>;
    /** Event emitted when the sidenav is fully closed. */
    onClose: EventEmitter<void>;
    /** Event emitted when the sidenav alignment changes. */
    onAlignChanged: EventEmitter<void>;
    /** The current toggle animation promise. `null` if no animation is in progress. */
    private _toggleAnimationPromise;
    /**
     * The current toggle animation promise resolution function.
     * `null` if no animation is in progress.
     */
    private _resolveToggleAnimationPromise;
    readonly isFocusTrapEnabled: boolean;
    /**
     * @param _elementRef The DOM element reference. Used for transition and width calculation.
     *     If not available we do not hook on transitions.
     */
    constructor(_elementRef: ElementRef, _focusTrapFactory: FocusTrapFactory, _doc: any);
    /**
     * If focus is currently inside the sidenav, restores it to where it was before the sidenav
     * opened.
     */
    private _restoreFocus();
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /**
     * Whether the sidenav is opened. We overload this because we trigger an event when it
     * starts or end.
     */
    opened: boolean;
    /** Open this sidenav, and return a Promise that will resolve when it's fully opened (or get
     * rejected if it didn't). */
    open(): Promise<MdSidenavToggleResult>;
    /**
     * Close this sidenav, and return a Promise that will resolve when it's fully closed (or get
     * rejected if it didn't).
     */
    close(): Promise<MdSidenavToggleResult>;
    /**
     * Toggle this sidenav. This is equivalent to calling open() when it's already opened, or
     * close() when it's closed.
     * @param isOpen Whether the sidenav should be open.
     * @returns Resolves with the result of whether the sidenav was opened or closed.
     */
    toggle(isOpen?: boolean): Promise<MdSidenavToggleResult>;
    /**
     * Handles the keyboard events.
     * @docs-private
     */
    handleKeydown(event: KeyboardEvent): void;
    /**
     * When transition has finished, set the internal state for classes and emit the proper event.
     * The event passed is actually of type TransitionEvent, but that type is not available in
     * Android so we use any.
     */
    _onTransitionEnd(transitionEvent: TransitionEvent): void;
    readonly _isClosing: boolean;
    readonly _isOpening: boolean;
    readonly _isClosed: boolean;
    readonly _isOpened: boolean;
    readonly _isEnd: boolean;
    readonly _modeSide: boolean;
    readonly _modeOver: boolean;
    readonly _modePush: boolean;
    readonly _width: any;
    private _elementFocusedBeforeSidenavWasOpened;
}
/**
 * <md-sidenav-container> component.
 *
 * This is the parent component to one or two <md-sidenav>s that validates the state internally
 * and coordinates the backdrop and content styling.
 */
export declare class MdSidenavContainer implements AfterContentInit {
    private _dir;
    private _element;
    private _renderer;
    private _ngZone;
    _sidenavs: QueryList<MdSidenav>;
    /** The sidenav child with the `start` alignment. */
    readonly start: MdSidenav | null;
    /** The sidenav child with the `end` alignment. */
    readonly end: MdSidenav | null;
    /** Event emitted when the sidenav backdrop is clicked. */
    backdropClick: EventEmitter<void>;
    /** The sidenav at the start/end alignment, independent of direction. */
    private _start;
    private _end;
    /**
     * The sidenav at the left/right. When direction changes, these will change as well.
     * They're used as aliases for the above to set the left/right style properly.
     * In LTR, _left == _start and _right == _end.
     * In RTL, _left == _end and _right == _start.
     */
    private _left;
    private _right;
    /** Whether to enable open/close trantions. */
    _enableTransitions: boolean;
    constructor(_dir: Directionality, _element: ElementRef, _renderer: Renderer2, _ngZone: NgZone);
    ngAfterContentInit(): void;
    /** Calls `open` of both start and end sidenavs */
    open(): Promise<MdSidenavToggleResult[]>;
    /** Calls `close` of both start and end sidenavs */
    close(): Promise<MdSidenavToggleResult[]>;
    /**
     * Subscribes to sidenav events in order to set a class on the main container element when the
     * sidenav is open and the backdrop is visible. This ensures any overflow on the container element
     * is properly hidden.
     */
    private _watchSidenavToggle(sidenav);
    /**
     * Subscribes to sidenav onAlignChanged event in order to re-validate drawers when the align
     * changes.
     */
    private _watchSidenavAlign(sidenav);
    /** Toggles the 'mat-sidenav-opened' class on the main 'md-sidenav-container' element. */
    private _setContainerClass(isAdd);
    /** Validate the state of the sidenav children components. */
    private _validateDrawers();
    _onBackdropClicked(): void;
    _closeModalSidenav(): void;
    _isShowingBackdrop(): boolean;
    private _isSidenavOpen(side);
    /**
     * Return the width of the sidenav, if it's in the proper mode and opened.
     * This may relayout the view, so do not call this often.
     * @param sidenav
     * @param mode
     */
    private _getSidenavEffectiveWidth(sidenav, mode);
    _getMarginLeft(): number;
    _getMarginRight(): number;
    _getPositionLeft(): number;
    _getPositionRight(): number;
    /**
     * Returns the horizontal offset for the content area.  There should never be a value for both
     * left and right, so by subtracting the right value from the left value, we should always get
     * the appropriate offset.
     */
    _getPositionOffset(): number;
    /**
     * This is using [ngStyle] rather than separate [style...] properties because [style.transform]
     * doesn't seem to work right now.
     */
    _getStyles(): {
        marginLeft: string;
        marginRight: string;
        transform: string;
    };
}
