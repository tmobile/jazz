/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, QueryList, OnDestroy } from '@angular/core';
import { MdChip } from './chip';
import { FocusKeyManager } from '../core/a11y/focus-key-manager';
/**
 * A material design chips component (named ChipList for it's similarity to the List component).
 *
 * Example:
 *
 *     <md-chip-list>
 *       <md-chip>Chip 1<md-chip>
 *       <md-chip>Chip 2<md-chip>
 *     </md-chip-list>
 */
export declare class MdChipList implements AfterContentInit, OnDestroy {
    /** Track which chips we're listening to for focus/destruction. */
    private _subscribed;
    /** Subscription to tabbing out from the chip list. */
    private _tabOutSubscription;
    /** Whether or not the chip is selectable. */
    protected _selectable: boolean;
    /** The FocusKeyManager which handles focus. */
    _keyManager: FocusKeyManager;
    /** The chip components contained within this chip list. */
    chips: QueryList<MdChip>;
    /** Tab index for the chip list. */
    _tabIndex: number;
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /**
     * Whether or not this chip is selectable. When a chip is not selectable,
     * it's selected state is always ignored.
     */
    selectable: boolean;
    /**
     * Programmatically focus the chip list. This in turn focuses the first
     * non-disabled chip in this chip list.
     */
    focus(): void;
    /** Passes relevant key presses to our key manager. */
    _keydown(event: KeyboardEvent): void;
    /** Toggles the selected state of the currently focused chip. */
    protected _toggleSelectOnFocusedChip(): void;
    /**
     * Iterate through the list of chips and add them to our list of
     * subscribed chips.
     *
     * @param chips The list of chips to be subscribed.
     */
    protected _subscribeChips(chips: QueryList<MdChip>): void;
    /**
     * Add a specific chip to our subscribed list. If the chip has
     * already been subscribed, this ensures it is only subscribed
     * once.
     *
     * @param chip The chip to be subscribed (or checked for existing
     * subscription).
     */
    protected _addChip(chip: MdChip): void;
    /**
     * Utility to ensure all indexes are valid.
     *
     * @param index The index to be checked.
     * @returns True if the index is valid for our list of chips.
     */
    private _isValidIndex(index);
}
