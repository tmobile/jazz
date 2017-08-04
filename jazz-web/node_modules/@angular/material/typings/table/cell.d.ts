/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef, Renderer2 } from '@angular/core';
import { CdkCell, CdkColumnDef, CdkHeaderCell } from '@angular/cdk';
/** Workaround for https://github.com/angular/angular/issues/17849 */
export declare const _MdHeaderCellBase: typeof CdkHeaderCell;
export declare const _MdCell: typeof CdkCell;
/** Header cell template container that adds the right classes and role. */
export declare class MdHeaderCell extends _MdHeaderCellBase {
    constructor(columnDef: CdkColumnDef, elementRef: ElementRef, renderer: Renderer2);
}
/** Cell template container that adds the right classes and role. */
export declare class MdCell extends _MdCell {
    constructor(columnDef: CdkColumnDef, elementRef: ElementRef, renderer: Renderer2);
}
