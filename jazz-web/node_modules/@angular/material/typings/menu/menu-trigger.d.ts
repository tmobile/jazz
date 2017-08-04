/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterViewInit, ElementRef, EventEmitter, OnDestroy, ViewContainerRef } from '@angular/core';
import { MdMenuPanel } from './menu-panel';
import { Directionality, Direction, Overlay } from '../core';
/**
 * This directive is intended to be used in conjunction with an md-menu tag.  It is
 * responsible for toggling the display of the provided menu instance.
 */
export declare class MdMenuTrigger implements AfterViewInit, OnDestroy {
    private _overlay;
    private _element;
    private _viewContainerRef;
    private _dir;
    private _portal;
    private _overlayRef;
    private _menuOpen;
    private _backdropSubscription;
    private _positionSubscription;
    private _openedByMouse;
    /** @deprecated */
    _deprecatedMdMenuTriggerFor: MdMenuPanel;
    /** @deprecated */
    _deprecatedMatMenuTriggerFor: MdMenuPanel;
    _matMenuTriggerFor: MdMenuPanel;
    /** References the menu instance that the trigger is associated with. */
    menu: MdMenuPanel;
    /** Event emitted when the associated menu is opened. */
    onMenuOpen: EventEmitter<void>;
    /** Event emitted when the associated menu is closed. */
    onMenuClose: EventEmitter<void>;
    constructor(_overlay: Overlay, _element: ElementRef, _viewContainerRef: ViewContainerRef, _dir: Directionality);
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    /** Whether the menu is open. */
    readonly menuOpen: boolean;
    /** Toggles the menu between the open and closed states. */
    toggleMenu(): void;
    /** Opens the menu. */
    openMenu(): void;
    /** Closes the menu. */
    closeMenu(): void;
    /** Removes the menu from the DOM. */
    destroyMenu(): void;
    /** Focuses the menu trigger. */
    focus(): void;
    /** The text direction of the containing app. */
    readonly dir: Direction;
    /**
     * This method ensures that the menu closes when the overlay backdrop is clicked.
     * We do not use first() here because doing so would not catch clicks from within
     * the menu, and it would fail to unsubscribe properly. Instead, we unsubscribe
     * explicitly when the menu is closed or destroyed.
     */
    private _subscribeToBackdrop();
    /**
     * This method sets the menu state to open and focuses the first item if
     * the menu was opened via the keyboard.
     */
    private _initMenu();
    /**
     * This method resets the menu when it's closed, most importantly restoring
     * focus to the menu trigger if the menu was opened via the keyboard.
     */
    private _resetMenu();
    private _setIsMenuOpen(isOpen);
    /**
     *  This method checks that a valid instance of MdMenu has been passed into
     *  mdMenuTriggerFor. If not, an exception is thrown.
     */
    private _checkMenu();
    /**
     *  This method creates the overlay from the provided menu's template and saves its
     *  OverlayRef so that it can be attached to the DOM when openMenu is called.
     */
    private _createOverlay();
    /**
     * This method builds the configuration object needed to create the overlay, the OverlayState.
     * @returns OverlayState
     */
    private _getOverlayConfig();
    /**
     * Listens to changes in the position of the overlay and sets the correct classes
     * on the menu based on the new position. This ensures the animation origin is always
     * correct, even if a fallback position is used for the overlay.
     */
    private _subscribeToPositions(position);
    /**
     * This method builds the position strategy for the overlay, so the menu is properly connected
     * to the trigger.
     * @returns ConnectedPositionStrategy
     */
    private _getPosition();
    private _cleanUpSubscriptions();
    _handleMousedown(event: MouseEvent): void;
}
