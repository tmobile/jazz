import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'create-service-custom-form',
  templateUrl: './create-service-custom-form.component.html',
  styleUrls: ['./create-service-custom-form.component.scss']
})
export class CreateServiceCustomFormComponent implements OnInit {

  public customForm = {
    first: 'one'
  };

  public options = this.defineOptions();

  constructor() {
  }

  ngOnInit() {
  }

  defineOptions() {
    return [
      {
        label: 'Option1',
        value: 'one'
      },
      {
        label: 'Option2',
        value: 'two'
      }
    ]
  }

}
