import { NgModule } from '@angular/core';
import { NgbButtonLabel } from './label';
import { NgbCheckBox } from './checkbox';
import { NgbRadio, NgbRadioGroup } from './radio';
export { NgbButtonLabel } from './label';
export { NgbCheckBox } from './checkbox';
export { NgbRadio, NgbRadioGroup } from './radio';
var NGB_BUTTON_DIRECTIVES = [NgbButtonLabel, NgbCheckBox, NgbRadioGroup, NgbRadio];
var NgbButtonsModule = (function () {
    function NgbButtonsModule() {
    }
    NgbButtonsModule.forRoot = function () { return { ngModule: NgbButtonsModule, providers: [] }; };
    return NgbButtonsModule;
}());
export { NgbButtonsModule };
NgbButtonsModule.decorators = [
    { type: NgModule, args: [{ declarations: NGB_BUTTON_DIRECTIVES, exports: NGB_BUTTON_DIRECTIVES },] },
];
/** @nocollapse */
NgbButtonsModule.ctorParameters = function () { return []; };
//# sourceMappingURL=buttons.module.js.map