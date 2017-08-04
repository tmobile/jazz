import { MdExpansionPanel } from './expansion-panel';
/**
 * <md-expansion-panel-header> component.
 *
 * This component corresponds to the header element of an <md-expansion-panel>.
 *
 * Please refer to README.md for examples on how to use it.
 */
export declare class MdExpansionPanelHeader {
    panel: MdExpansionPanel;
    constructor(panel: MdExpansionPanel);
    /** Toggles the expanded state of the panel. */
    _toggle(): void;
    /** Gets whether the panel is expanded. */
    _isExpanded(): boolean;
    /** Gets the expanded state string of the panel. */
    _getExpandedState(): string;
    /** Gets the panel id. */
    _getPanelId(): string;
    /** Gets whether the expand indicator is hidden. */
    _getHideToggle(): boolean;
    /** Handle keyup event calling to toggle() if appropriate. */
    _keyup(event: KeyboardEvent): void;
}
/**
 * <md-panel-description> directive.
 *
 * This direction is to be used inside of the MdExpansionPanelHeader component.
 */
export declare class MdExpansionPanelDescription {
}
/**
 * <md-panel-title> directive.
 *
 * This direction is to be used inside of the MdExpansionPanelHeader component.
 */
export declare class MdExpansionPanelTitle {
}
