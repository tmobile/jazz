import { ComponentType, Overlay, LiveAnnouncer } from '../core';
import { MdSnackBarConfig } from './snack-bar-config';
import { MdSnackBarRef } from './snack-bar-ref';
import { SimpleSnackBar } from './simple-snack-bar';
/**
 * Service to dispatch Material Design snack bar messages.
 */
export declare class MdSnackBar {
    private _overlay;
    private _live;
    private _parentSnackBar;
    /**
     * Reference to the current snack bar in the view *at this level* (in the Angular injector tree).
     * If there is a parent snack-bar service, all operations should delegate to that parent
     * via `_openedSnackBarRef`.
     */
    private _snackBarRefAtThisLevel;
    /** Reference to the currently opened snackbar at *any* level. */
    _openedSnackBarRef: MdSnackBarRef<any> | null;
    constructor(_overlay: Overlay, _live: LiveAnnouncer, _parentSnackBar: MdSnackBar);
    /**
     * Creates and dispatches a snack bar with a custom component for the content, removing any
     * currently opened snack bars.
     *
     * @param component Component to be instantiated.
     * @param config Extra configuration for the snack bar.
     */
    openFromComponent<T>(component: ComponentType<T>, config?: MdSnackBarConfig): MdSnackBarRef<T>;
    /**
     * Opens a snackbar with a message and an optional action.
     * @param message The message to show in the snackbar.
     * @param action The label for the snackbar action.
     * @param config Additional configuration options for the snackbar.
     */
    open(message: string, action?: string, config?: MdSnackBarConfig): MdSnackBarRef<SimpleSnackBar>;
    /**
     * Dismisses the currently-visible snack bar.
     */
    dismiss(): void;
    /**
     * Attaches the snack bar container component to the overlay.
     */
    private _attachSnackBarContainer(overlayRef, config);
    /**
     * Places a new component as the content of the snack bar container.
     */
    private _attachSnackbarContent<T>(component, container, overlayRef);
    /**
     * Creates a new overlay and places it in the correct location.
     * @param config The user-specified snack bar config.
     */
    private _createOverlay(config);
}
