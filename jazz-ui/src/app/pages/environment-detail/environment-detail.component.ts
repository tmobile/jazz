import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'environment-detail',
  templateUrl: './environment-detail.component.html',
  styleUrls: ['./environment-detail.component.scss']
})
export class EnvironmentDetailComponent implements OnInit {

  service = {
    id: '1',
    name : 'Service One',
    serviceType : 'API',
    runtime : 'Python',
    status : 'Active',
    domain : 'tmo.com'
  }
	breadcrumbs = []
  selectedTab = 0;
  tabData = ['assets','logs','details'];
  environment = {
  	name: 'Dev'
  }
  constructor() { }

  onTabSelected (i) {
    this.selectedTab = i;
  };

  ngOnInit()
  {
    this. breadcrumbs = [
    	{
	      'name' : 'Service',
	      'link' : 'services'
	    },
	    {
	      'name' : this.service['name'],
	      'link' : 'services/' + this.service['id']
	    },
	    {
	      'name' : this.environment['name'],
	      'link' : ''
	    }
    ];
  }

}
