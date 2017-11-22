import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'env-overview-section',
  templateUrl: './env-overview-section.component.html',
  styleUrls: ['./env-overview-section.component.scss']
})
export class EnvOverviewSectionComponent implements OnInit {

  @Input() service: any = {};
  @Input() env:any;
  endPoint='';
  services = {
    description:'Sample description',
    lastcommit:'2 Hours Ago',
    branchname:'CAPI 500',
    endpoint:'Cloud Notifications',
    repository:'View on bucket',
    runtime:'Python',
    tags: 'Pacman, MyService'
  }
  constructor() { }


  ngOnInit() {
    console.log(this.env);
    console.log(this.service);
    this.endPoint='NA';
    this.endpointUrl();
  }
  ngOnChanges(x:any){
    console.log(this.service);
    this.endpointUrl();
    
  }
  endpointUrl(){
    if(this.service.endpoints != undefined){
      this.endPoint = this.service.endpoints[this.env]
    }
  }

}
