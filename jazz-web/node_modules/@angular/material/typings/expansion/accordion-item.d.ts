/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventEmitter, OnDestroy } from '@angular/core';
import { UniqueSelectionDispatcher } from '../core';
import { CdkAccordion } from './accordion';
/**
 * An abstract class to be extended and decorated as a component.  Sets up all
 * events and attributes needed to be managed by a CdkAccordion parent.
 */
export declare class AccordionItem implements OnDestroy {
    accordion: CdkAccordion;
    protected _expansionDispatcher: UniqueSelectionDispatcher;
    /** Event emitted every time the MdAccordianChild is closed. */
    closed: EventEmitter<void>;
    /** Event emitted every time the MdAccordianChild is opened. */
    opened: EventEmitter<void>;
    /** Event emitted when the MdAccordianChild is destroyed. */
    destroyed: EventEmitter<void>;
    /** The unique MdAccordianChild id. */
    readonly id: string;
    /** Whether the MdAccordianChild is expanded. */
    expanded: boolean;
    private _expanded;
    /** Unregister function for _expansionDispatcher **/
    private _removeUniqueSelectionListener;
    constructor(accordion: CdkAccordion, _expansionDispatcher: UniqueSelectionDispatcher);
    /** Emits an event for the accordion item being destroyed. */
    ngOnDestroy(): void;
    /** Toggles the expanded state of the accordion item. */
    toggle(): void;
    /** Sets the expanded state of the accordion item to false. */
    close(): void;
    /** Sets the expanded state of the accordion item to true. */
    open(): void;
}
