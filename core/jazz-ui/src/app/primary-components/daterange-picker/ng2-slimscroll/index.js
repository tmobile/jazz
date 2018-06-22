import { NgModule } from '@angular/core';
import { SlimScrollDirective } from './src/directives/slimscroll.directive';
export * from './src/classes/slimscroll-options.class';
var SlimScrollModule = (function () {
    function SlimScrollModule() {
    }
    return SlimScrollModule;
}());
export { SlimScrollModule };
SlimScrollModule.decorators = [
    { type: NgModule, args: [{
                declarations: [
                    SlimScrollDirective
                ],
                exports: [
                    SlimScrollDirective
                ]
            },] },
];
/** @nocollapse */
SlimScrollModule.ctorParameters = function () { return []; };
