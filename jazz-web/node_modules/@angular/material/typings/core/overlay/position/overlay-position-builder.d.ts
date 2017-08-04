/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ViewportRuler } from './viewport-ruler';
import { ConnectedPositionStrategy } from './connected-position-strategy';
import { ElementRef } from '@angular/core';
import { GlobalPositionStrategy } from './global-position-strategy';
import { OverlayConnectionPosition, OriginConnectionPosition } from './connected-position';
/** Builder for overlay position strategy. */
export declare class OverlayPositionBuilder {
    private _viewportRuler;
    constructor(_viewportRuler: ViewportRuler);
    /**
     * Creates a global position strategy.
     */
    global(): GlobalPositionStrategy;
    /**
     * Creates a relative position strategy.
     * @param elementRef
     * @param originPos
     * @param overlayPos
     */
    connectedTo(elementRef: ElementRef, originPos: OriginConnectionPosition, overlayPos: OverlayConnectionPosition): ConnectedPositionStrategy;
}
