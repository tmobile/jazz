import { ElementRef } from "@angular/core";
export declare class DropdownNotClosableZone {
    private elementRef;
    dropdownNotClosabledZone: boolean;
    constructor(elementRef: ElementRef);
    contains(element: HTMLElement): boolean;
}
