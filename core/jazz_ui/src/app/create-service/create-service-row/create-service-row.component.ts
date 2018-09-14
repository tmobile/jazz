import {Component, Input, OnChanges, OnInit} from '@angular/core';

@Component({
  selector: 'create-service-row',
  templateUrl: './create-service-row.component.html',
  styleUrls: ['./create-service-row.component.scss']
})
export class CreateServiceRowComponent implements OnInit, OnChanges {
 @Input() title;
 @Input() subtitle;
 @Input() required;
 @Input() type;
 // Takes space separated list of service types to be shown for ie. 'api website' or 'function'
 //  If either type='' or serviceTypes='' the row is available for all service types
 @Input() serviceTypes;

 public hideForServiceType = false;


  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes) {
    this.hideForServiceType = false;
    if(this.type && this.serviceTypes) {
      let typeMatches = this.serviceTypes.toLowerCase().split(' ').find((serviceType) => {
        return serviceType === this.type;
      });
        this.hideForServiceType = !typeMatches;
    }
  }

}
