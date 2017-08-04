/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OverlayRef } from '../core';
import { DialogPosition } from './dialog-config';
import { Observable } from 'rxjs/Observable';
import { MdDialogContainer } from './dialog-container';
/**
 * Reference to a dialog opened via the MdDialog service.
 */
export declare class MdDialogRef<T> {
    private _overlayRef;
    private _containerInstance;
    /** The instance of component opened into the dialog. */
    componentInstance: T;
    /** Whether the user is allowed to close the dialog. */
    disableClose: boolean | undefined;
    /** Subject for notifying the user that the dialog has finished closing. */
    private _afterClosed;
    /** Result to be passed to afterClosed. */
    private _result;
    constructor(_overlayRef: OverlayRef, _containerInstance: MdDialogContainer);
    /**
     * Close the dialog.
     * @param dialogResult Optional result to return to the dialog opener.
     */
    close(dialogResult?: any): void;
    /**
     * Gets an observable that is notified when the dialog is finished closing.
     */
    afterClosed(): Observable<any>;
    /**
     * Updates the dialog's position.
     * @param position New dialog position.
     */
    updatePosition(position?: DialogPosition): this;
    /**
     * Updates the dialog's width and height.
     * @param width New width of the dialog.
     * @param height New height of the dialog.
     */
    updateSize(width?: string, height?: string): this;
    /** Fetches the position strategy object from the overlay ref. */
    private _getPositionStrategy();
}
