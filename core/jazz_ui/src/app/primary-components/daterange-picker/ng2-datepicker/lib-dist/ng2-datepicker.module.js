import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlimScrollModule } from '../../ng2-slimscroll';
import { DatePickerComponent } from './ng2-datepicker.component';
export { DatePickerOptions, DateModel } from './ng2-datepicker.component';
export var DatePickerModule = (function () {
    function DatePickerModule() {
    }
    DatePickerModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [
                        DatePickerComponent
                    ],
                    imports: [
                        CommonModule,
                        FormsModule,
                        SlimScrollModule
                    ],
                    exports: [
                        DatePickerComponent,
                        SlimScrollModule,
                        FormsModule
                    ]
                },] },
    ];
    /** @nocollapse */
    DatePickerModule.ctorParameters = function () { return []; };
    return DatePickerModule;
}());
//-# sourceMappingURL=ng2-datepicker.module.js.map