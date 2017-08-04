/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AfterContentInit, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { MdInkBar } from '../ink-bar';
import { CanDisable } from '../../core/common-behaviors/disabled';
import { ViewportRuler } from '../../core/overlay/position/viewport-ruler';
import { Directionality, Platform, RippleGlobalOptions } from '../../core';
/**
 * Navigation component matching the styles of the tab group header.
 * Provides anchored navigation with animated ink bar.
 */
export declare class MdTabNav implements AfterContentInit, OnDestroy {
    private _dir;
    private _ngZone;
    /** Subject that emits when the component has been destroyed. */
    private _onDestroy;
    _activeLinkChanged: boolean;
    _activeLinkElement: ElementRef;
    _inkBar: MdInkBar;
    /** Subscription for window.resize event **/
    private _resizeSubscription;
    constructor(_dir: Directionality, _ngZone: NgZone);
    /** Notifies the component that the active link has been changed. */
    updateActiveLink(element: ElementRef): void;
    ngAfterContentInit(): void;
    /** Checks if the active link has been changed and, if so, will update the ink bar. */
    ngAfterContentChecked(): void;
    ngOnDestroy(): void;
    /** Aligns the ink bar to the active link. */
    _alignInkBar(): void;
}
export declare class MdTabLinkBase {
}
export declare const _MdTabLinkMixinBase: (new (...args: any[]) => CanDisable) & typeof MdTabLinkBase;
/**
 * Link inside of a `md-tab-nav-bar`.
 */
export declare class MdTabLink extends _MdTabLinkMixinBase implements OnDestroy, CanDisable {
    private _mdTabNavBar;
    private _elementRef;
    /** Whether the tab link is active or not. */
    private _isActive;
    /** Reference to the instance of the ripple for the tab link. */
    private _tabLinkRipple;
    /** Whether the link is active. */
    active: boolean;
    /** @docs-private */
    readonly tabIndex: number;
    constructor(_mdTabNavBar: MdTabNav, _elementRef: ElementRef, ngZone: NgZone, ruler: ViewportRuler, platform: Platform, globalOptions: RippleGlobalOptions);
    ngOnDestroy(): void;
}
