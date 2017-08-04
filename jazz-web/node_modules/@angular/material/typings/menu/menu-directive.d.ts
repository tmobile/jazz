/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, EventEmitter, OnDestroy, QueryList, TemplateRef, ElementRef } from '@angular/core';
import { MenuPositionX, MenuPositionY } from './menu-positions';
import { MdMenuItem } from './menu-item';
import { MdMenuPanel } from './menu-panel';
export declare class MdMenu implements AfterContentInit, MdMenuPanel, OnDestroy {
    private _elementRef;
    private _keyManager;
    private _xPosition;
    private _yPosition;
    /** Subscription to tab events on the menu panel */
    private _tabSubscription;
    /** Config object to be passed into the menu's ngClass */
    _classList: any;
    /** Position of the menu in the X axis. */
    xPosition: MenuPositionX;
    /** Position of the menu in the Y axis. */
    yPosition: MenuPositionY;
    templateRef: TemplateRef<any>;
    /** List of the items inside of a menu. */
    items: QueryList<MdMenuItem>;
    /** Whether the menu should overlap its trigger. */
    overlapTrigger: boolean;
    /**
     * This method takes classes set on the host md-menu element and applies them on the
     * menu template that displays in the overlay container.  Otherwise, it's difficult
     * to style the containing menu from outside the component.
     * @param classes list of class names
     */
    classList: string;
    /** Event emitted when the menu is closed. */
    close: EventEmitter<void>;
    constructor(_elementRef: ElementRef);
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /** Handle a keyboard event from the menu, delegating to the appropriate action. */
    _handleKeydown(event: KeyboardEvent): void;
    /**
     * Focus the first item in the menu. This method is used by the menu trigger
     * to focus the first item when the menu is opened by the ENTER key.
     */
    focusFirstItem(): void;
    /**
     * This emits a close event to which the trigger is subscribed. When emitted, the
     * trigger will close the menu.
     */
    _emitCloseEvent(): void;
    /**
     * It's necessary to set position-based classes to ensure the menu panel animation
     * folds out from the correct direction.
     */
    setPositionClasses(posX?: "before" | "after", posY?: "above" | "below"): void;
}
