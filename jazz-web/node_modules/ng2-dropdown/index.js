"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var DropdownNotClosableZone_1 = require("./DropdownNotClosableZone");
var Dropdown_1 = require("./Dropdown");
var DropdownOpen_1 = require("./DropdownOpen");
__export(require("./DropdownNotClosableZone"));
__export(require("./Dropdown"));
__export(require("./DropdownOpen"));
var DropdownModule = (function () {
    function DropdownModule() {
    }
    DropdownModule.decorators = [
        { type: core_1.NgModule, args: [{
                    imports: [
                        common_1.CommonModule
                    ],
                    declarations: [
                        DropdownNotClosableZone_1.DropdownNotClosableZone,
                        Dropdown_1.Dropdown,
                        DropdownOpen_1.DropdownOpen,
                    ],
                    exports: [
                        DropdownNotClosableZone_1.DropdownNotClosableZone,
                        Dropdown_1.Dropdown,
                        DropdownOpen_1.DropdownOpen,
                    ]
                },] },
    ];
    /** @nocollapse */
    DropdownModule.ctorParameters = [];
    return DropdownModule;
}());
exports.DropdownModule = DropdownModule;
//# sourceMappingURL=index.js.map