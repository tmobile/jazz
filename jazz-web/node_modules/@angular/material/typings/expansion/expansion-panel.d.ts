import { MdAccordion, MdAccordionDisplayMode } from './accordion';
import { AccordionItem } from './accordion-item';
import { UniqueSelectionDispatcher } from '../core';
/** MdExpansionPanel's states. */
export declare type MdExpansionPanelState = 'expanded' | 'collapsed';
/** Time and timing curve for expansion panel animations. */
export declare const EXPANSION_PANEL_ANIMATION_TIMING = "225ms cubic-bezier(0.4,0.0,0.2,1)";
/**
 * <md-expansion-panel> component.
 *
 * This component can be used as a single element to show expandable content, or as one of
 * multiple children of an element with the CdkAccordion directive attached.
 *
 * Please refer to README.md for examples on how to use it.
 */
export declare class MdExpansionPanel extends AccordionItem {
    /** Whether the toggle indicator should be hidden. */
    hideToggle: boolean;
    constructor(accordion: MdAccordion, _uniqueSelectionDispatcher: UniqueSelectionDispatcher);
    /** Whether the expansion indicator should be hidden. */
    _getHideToggle(): boolean;
    /** Gets the panel's display mode. */
    _getDisplayMode(): MdAccordionDisplayMode | MdExpansionPanelState;
    /** Gets the expanded state string. */
    _getExpandedState(): MdExpansionPanelState;
}
export declare class MdExpansionPanelActionRow {
}
