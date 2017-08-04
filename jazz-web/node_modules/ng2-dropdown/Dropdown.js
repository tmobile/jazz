"use strict";
var core_1 = require("@angular/core");
var DropdownNotClosableZone_1 = require("./DropdownNotClosableZone");
var Dropdown = (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function Dropdown(elementRef) {
        this.elementRef = elementRef;
        // -------------------------------------------------------------------------
        // Inputs / Outputs
        // -------------------------------------------------------------------------
        this.toggleClick = true;
        this.activateOnFocus = false;
        this.onOpen = new core_1.EventEmitter();
        this.onClose = new core_1.EventEmitter();
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    Dropdown.prototype.open = function () {
        var element = this.elementRef.nativeElement;
        element.classList.add("open");
        this.onOpen.emit(undefined);
    };
    Dropdown.prototype.close = function () {
        var element = this.elementRef.nativeElement;
        element.classList.remove("open");
        this.onClose.emit(undefined);
    };
    Dropdown.prototype.isOpened = function () {
        var element = this.elementRef.nativeElement;
        return element.classList.contains("open");
    };
    Dropdown.prototype.isInClosableZone = function (element) {
        if (!this.notClosableZone)
            return false;
        return this.notClosableZone.contains(element);
    };
    Dropdown.decorators = [
        { type: core_1.Directive, args: [{
                    selector: "[dropdown]",
                    exportAs: "dropdown"
                },] },
    ];
    /** @nocollapse */
    Dropdown.ctorParameters = [
        { type: core_1.ElementRef, },
    ];
    Dropdown.propDecorators = {
        'toggleClick': [{ type: core_1.Input, args: ["dropdownToggle",] },],
        'activateOnFocus': [{ type: core_1.Input, args: ["dropdownFocusActivate",] },],
        'onOpen': [{ type: core_1.Output },],
        'onClose': [{ type: core_1.Output },],
        'notClosableZone': [{ type: core_1.ContentChild, args: [DropdownNotClosableZone_1.DropdownNotClosableZone,] },],
    };
    return Dropdown;
}());
exports.Dropdown = Dropdown;
//# sourceMappingURL=Dropdown.js.map