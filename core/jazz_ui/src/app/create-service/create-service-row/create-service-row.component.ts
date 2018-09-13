import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'create-service-row',
  templateUrl: './create-service-row.component.html',
  styleUrls: ['./create-service-row.component.scss']
})
export class CreateServiceRowComponent implements OnInit {
 @Input() title;
 @Input() subtitle;
 @Input() required;


  constructor() { }

  ngOnInit() {
  }

}
