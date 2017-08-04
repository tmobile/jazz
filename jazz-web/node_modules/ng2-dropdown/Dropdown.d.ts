import { ElementRef, EventEmitter } from "@angular/core";
import { DropdownNotClosableZone } from "./DropdownNotClosableZone";
export declare class Dropdown {
    private elementRef;
    toggleClick: boolean;
    activateOnFocus: boolean;
    onOpen: EventEmitter<{}>;
    onClose: EventEmitter<{}>;
    notClosableZone: DropdownNotClosableZone;
    constructor(elementRef: ElementRef);
    open(): void;
    close(): void;
    isOpened(): boolean;
    isInClosableZone(element: HTMLElement): boolean;
}
