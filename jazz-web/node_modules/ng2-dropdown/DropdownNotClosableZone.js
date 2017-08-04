"use strict";
var core_1 = require("@angular/core");
var DropdownNotClosableZone = (function () {
    function DropdownNotClosableZone(elementRef) {
        this.elementRef = elementRef;
    }
    DropdownNotClosableZone.prototype.contains = function (element) {
        if (this.dropdownNotClosabledZone === false)
            return false;
        var thisElement = this.elementRef.nativeElement;
        return thisElement.contains(element);
    };
    DropdownNotClosableZone.decorators = [
        { type: core_1.Directive, args: [{
                    selector: "[dropdown-not-closable-zone]"
                },] },
    ];
    /** @nocollapse */
    DropdownNotClosableZone.ctorParameters = [
        { type: core_1.ElementRef, },
    ];
    DropdownNotClosableZone.propDecorators = {
        'dropdownNotClosabledZone': [{ type: core_1.Input, args: ["dropdown-not-closable-zone",] },],
    };
    return DropdownNotClosableZone;
}());
exports.DropdownNotClosableZone = DropdownNotClosableZone;
//# sourceMappingURL=DropdownNotClosableZone.js.map