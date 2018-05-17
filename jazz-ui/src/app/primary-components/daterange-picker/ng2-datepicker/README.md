# ng2-datepicker
Angular2 Datepicker Component

***ng2-datepicker*** is a datepicker component for Angular2.

## Demo

[http://ng2-datepicker.jankuri.com](http://ng2-datepicker.jankuri.com)

Looking for a date range picker? Check this one: [http://ng-daterangepicker.jankuri.com](http://ng-daterangepicker.jankuri.com)

## Installation:

Install ng2-datepicker via `npm`

````shell
npm install ng2-datepicker --save
````

## Integration

```ts
// app.module.ts
import { DatePickerModule } from 'ng2-datepicker';

@NgModule({
  ...
  imports: [ DatePickerModule ]
  ...
})
export class AppModule { }

// app.component.ts
import { Component } from '@angular/core';
import { DatePickerOptions, DateModel } from 'ng2-datepicker';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  date: DateModel;
  options: DatePickerOptions;

  constructor() {
    this.options = new DatePickerOptions();
  }
}

// app.component.html
<ng2-datepicker [options]="options" [(ngModel)]="date"></ng2-datepicker>
```

For more info about options please see [this](https://github.com/jkuri/ng2-datepicker/blob/master/src/ng2-datepicker/ng2-datepicker.component.ts#L41-L53).

## Run Included Demo

```shell
git clone https://github.com/jkuri/ng2-datepicker.git --depth 1
cd ng2-datepicker
npm install
npm start
```

## AoT Library Build

```shell
npm run build:lib
```

## Licence

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
