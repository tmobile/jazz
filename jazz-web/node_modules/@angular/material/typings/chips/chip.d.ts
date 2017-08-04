/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, EventEmitter, OnDestroy, Renderer2 } from '@angular/core';
import { Focusable } from '../core/a11y/focus-key-manager';
import { CanColor } from '../core/common-behaviors/color';
import { CanDisable } from '../core/common-behaviors/disabled';
export interface MdChipEvent {
    chip: MdChip;
}
/** @docs-private */
export declare class MdChipBase {
    _renderer: Renderer2;
    _elementRef: ElementRef;
    constructor(_renderer: Renderer2, _elementRef: ElementRef);
}
export declare const _MdChipMixinBase: (new (...args: any[]) => CanColor) & (new (...args: any[]) => CanDisable) & typeof MdChipBase;
/**
 * Dummy directive to add CSS class to basic chips.
 * @docs-private
 */
export declare class MdBasicChip {
}
/**
 * Material design styled Chip component. Used inside the MdChipList component.
 */
export declare class MdChip extends _MdChipMixinBase implements Focusable, OnDestroy, CanColor, CanDisable {
    /** Whether the chip is selected. */
    selected: boolean;
    protected _selected: boolean;
    /** Whether the chip has focus. */
    _hasFocus: boolean;
    /** Emitted when the chip is focused. */
    onFocus: EventEmitter<MdChipEvent>;
    /** Emitted when the chip is selected. */
    select: EventEmitter<MdChipEvent>;
    /** Emitted when the chip is deselected. */
    deselect: EventEmitter<MdChipEvent>;
    /** Emitted when the chip is destroyed. */
    destroy: EventEmitter<MdChipEvent>;
    constructor(renderer: Renderer2, elementRef: ElementRef);
    ngOnDestroy(): void;
    /**
     * Toggles the current selected state of this chip.
     * @return Whether the chip is selected.
     */
    toggleSelected(): boolean;
    /** Allows for programmatic focusing of the chip. */
    focus(): void;
    /** Ensures events fire properly upon click. */
    _handleClick(event: Event): void;
}
