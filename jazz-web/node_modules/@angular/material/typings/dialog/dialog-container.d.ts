/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ComponentRef, NgZone, ElementRef, EventEmitter } from '@angular/core';
import { AnimationEvent } from '@angular/animations';
import { BasePortalHost, ComponentPortal, PortalHostDirective, TemplatePortal } from '../core';
import { MdDialogConfig } from './dialog-config';
import { FocusTrapFactory } from '../core/a11y/focus-trap';
/**
 * Throws an exception for the case when a ComponentPortal is
 * attached to a DomPortalHost without an origin.
 * @docs-private
 */
export declare function throwMdDialogContentAlreadyAttachedError(): void;
/**
 * Internal component that wraps user-provided dialog content.
 * Animation is based on https://material.io/guidelines/motion/choreography.html.
 * @docs-private
 */
export declare class MdDialogContainer extends BasePortalHost {
    private _ngZone;
    private _elementRef;
    private _focusTrapFactory;
    /** The portal host inside of this container into which the dialog content will be loaded. */
    _portalHost: PortalHostDirective;
    /** The class that traps and manages focus within the dialog. */
    private _focusTrap;
    /** Element that was focused before the dialog was opened. Save this to restore upon close. */
    private _elementFocusedBeforeDialogWasOpened;
    /** Reference to the global document object. */
    private _document;
    /** The dialog configuration. */
    _config: MdDialogConfig;
    /** State of the dialog animation. */
    _state: 'void' | 'enter' | 'exit';
    /** Emits the current animation state whenever it changes. */
    _onAnimationStateChange: EventEmitter<AnimationEvent>;
    /** ID of the element that should be considered as the dialog's label. */
    _ariaLabelledBy: string | null;
    constructor(_ngZone: NgZone, _elementRef: ElementRef, _focusTrapFactory: FocusTrapFactory, _document: any);
    /**
     * Attach a ComponentPortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T>;
    /**
     * Attach a TemplatePortal as content to this dialog container.
     * @param portal Portal to be attached as the dialog content.
     */
    attachTemplatePortal(portal: TemplatePortal): Map<string, any>;
    /** Moves the focus inside the focus trap. */
    private _trapFocus();
    /** Restores focus to the element that was focused before the dialog opened. */
    private _restoreFocus();
    /** Saves a reference to the element that was focused before the dialog was opened. */
    private _savePreviouslyFocusedElement();
    /** Callback, invoked whenever an animation on the host completes. */
    _onAnimationDone(event: AnimationEvent): void;
}
