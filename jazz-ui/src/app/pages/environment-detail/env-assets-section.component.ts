import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'env-assets-section',
  templateUrl: './env-assets-section.component.html',
  styleUrls: ['./env-assets-section.component.scss']
})
export class EnvAssetsSectionComponent implements OnInit {

  @Input() service: any = {};

	assetsList = [
		{
			name: 'Asset One',
			type: 'API Gateway',
			imgUrl: '/assets/images/aws/api_gateway.png',
			description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			gateway: 'Jane Smith',
			alarms: 'Active',
			rules: 'tmo.com',
			title: 'API'
		},
		{
			name: 'Asset Two',
			type: 'S3',
			imgUrl: '/assets/images/aws/s3.png',
			description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			gateway: 'Jane Smith',
			alarms: 'Active',
			rules: 'tmo.com',
			title: 'API'
		},
		{
			name: 'Asset Three',
			type: 'AWS Lambda',
			imgUrl: '/assets/images/aws/lambda.png',
			description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
			gateway: 'Jane Smith',
			alarms: 'Active',
			rules: 'tmo.com',
			title: 'API'
		}
	]

  constructor() { }

  ngOnInit() {
  }

}
