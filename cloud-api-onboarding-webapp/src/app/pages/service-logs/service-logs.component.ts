import { Component, OnInit } from '@angular/core';
import { Filter } from '../../secondary-components/tmobile-table/tmobile-filter';
import { Sort } from '../../secondary-components/tmobile-table/tmobile-table-sort';

@Component({
  selector: 'service-logs',
  templateUrl: './service-logs.component.html',
  styleUrls: ['./service-logs.component.scss']
})
export class ServiceLogsComponent implements OnInit {

	tableHeader = [
		{
			label: 'Time',
			key: 'time',
			sort: true,
			filter: {
				type: 'dateRange'
			}
		},{
			label: 'Message',
			key: 'message',
			sort: true,
			filter: {
				type: 'input'
			}
		},{
			label: 'Request ID',
			key: 'requestId',
			sort: true,
			filter: {
				type: ''
			}
		},{
			label: 'Log Level',
			key: 'logLevel',
			sort: true,
			filter: {
				type: 'dropdown',
				data: ['WARN', 'ERROR', 'INFO', 'VERBOSE', 'DEBUG']
			}
		}
	]

	logs = []

	logsData = [
		{
			time: '2017-05-30T09:36:12.210Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: '',
			message: 'START RequestId: 6b0bfa2b-451b-11e7-8b01-d9deac4f71e0 Version: $LATEST'
		},
		{
			time: '2017-05-30T09:36:12.845Z',
			requestId: '9e472a9c-4525-11e7-ab3f-773ba7a550a0',
			logLevel: 'INFO',
			message: 'eventDetailslatest\n{\n    "body": {\n        "service_type": "api",\n        "service_name": "testService-capi32830d",\n        "approvers": [\n            "AAnand12"\n        ],\n        "username": "aanand12",\n        "password": "Welcome@1234567",\n        "domain": "domain",\n        "runtime": "java",\n        "require_internal_access": true,\n        "slack_channel": "general"\n    },\n    "method": "POST",\n    "principalId": "",\n    "stage": "dev",\n    "headers": {\n        "Accept": "application/json, text/plain, */*",\n        "Accept-Encoding": "gzip, deflate, br",\n        "Accept-Language": "en-US,en;q=0.8",\n        "CloudFront-Forwarded-Proto": "https",\n        "CloudFront-Is-Desktop-Viewer": "true",\n        "CloudFront-Is-Mobile-Viewer": "false",\n        "CloudFront-Is-SmartTV-Viewer": "false",\n        "CloudFront-Is-Tablet-Viewer": "false",\n        "CloudFront-Viewer-Country": "US",\n        "content-type": "application/json",\n        "Host": "dev-cloud-api.corporate.t-mobile.com",\n        "origin": "http://localhost:4200",\n        "Referer": "http://localhost:4200/services",\n        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",\n        "Via": "2.0 16d2657cebef5191828b055567b4efeb.cloudfront.net (CloudFront)",\n        "X-Amz-Cf-Id": "PkYaef8MpkJXVfsISK1kqw03u2x5jNXHN5Mq62TJ2r_O6KAx5OG98Q==",\n        "X-Amzn-Trace-Id": "Root=1-592d3d0c-6e3ad9b21f31e5de6efcea4d",\n        "X-Forwarded-For": "206.29.176.51, 54.182.214.76",\n        "X-Forwarded-Port": "443",\n        "X-Forwarded-Proto": "https"\n    },\n    "query": {},\n    "path": {},\n    "identity": {\n        "cognitoIdentityPoolId": "",\n        "accountId": "",\n        "cognitoIdentityId": "",\n        "caller": "",\n        "apiKey": "",\n        "sourceIp": "206.29.176.51",\n        "accessKey": "",\n        "cognitoAuthenticationType": "",\n        "cognitoAuthenticationProvider": "",\n        "userArn": "",\n        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",\n        "user": ""\n    },\n    "stageVariables": {}\n}'
		},
		{
			time: '2017-05-30T09:36:13.513Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:13.534Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'DEBUG',
			message: 'value null'
		},
		{
			time: '2017-05-30T09:36:13.534Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'IncomingMessage { _readableState: ReadableState { objectMode: false, highWaterMark: 16384, buffer: [], length: 0, pipes: null, pipesCount: 0, flowing: true, ended: true, endEmitted: true, reading: false, sync: true, needReadable: false, emittedReadable:'
		},
		{
			time: '2017-05-30T09:36:13.813Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'VERBOSE',
			message: 'body { data: { message: \'authentication successfull\' }, input: { username: \'aanand12\' } }'
		},
		{
			time: '2017-05-30T09:36:13.813Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'DEBUG',
			message: 'in function capi328'
		},
		{
			time: '2017-05-30T09:36:13.815Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'DEBUG',
			message: 'enter function loop capi328'
		},
		{
			time: '2017-05-30T09:36:13.815Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'VERBOSE',
			message: 'after appending vpc { uri: \'https://cloud-api.corporate.t-mobile.com/api/platform/create-serverless-service\', method: \'POST\', json:  { service_type: \'api\', service_name: \'testService-capi32830d\', runtime: \'java\', username: \'aanand12\', approvers: [ \'AAnand12\' ], domain: \'domain\', request_id: \'6b85e4e0-451b-11e7-b7ca-73e8a165d222\', slack_channel: \'general\', require_internal_access: true }, rejectUnauthorized: false } '
		},
		{
			time: '2017-05-30T09:36:14.703Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:14.703Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:16.703Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'INFO',
			message: 'Event was recorded: [object Object]'
		},
		{
			time: '2017-05-30T09:36:16.146Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: 'VERBOSE',
			message: '{ return_result: { signin: { data: [Object], input: [Object] }, create_service: { data: \'Your Service Code will be available at https://bitbucket.corporate.t-mobile.com/projects/CAS/repos/domain_testservice-capi32830d/browse\', input: [Object] } }'
		},
		{
			time: '2017-05-30T09:36:16.866Z',
			requestId: '6b0bfa2b-451b-11e7-8b01-d9deac4f71e0',
			logLevel: '',
			message: ''
		}
	]

	filtersList = ['WARN', 'ERROR', 'INFO', 'VERBOSE', 'DEBUG']

	filterSelected: Boolean = false;
	searchActive: Boolean = false;
	searchbar: string = '';
	filter:any;
	sort:any;

	onRowClicked(row, index) {
		for (var i = 0; i < this.logs.length; i++) {
			var rowData = this.logs[i]

			if (i == index) {
				rowData['expanded'] = !rowData['expanded'];
			} else{
				rowData['expanded'] = false;
			}
		}
	}

	onFilter(column){
		this.logs = this.logsData

		for (var i = 0; i < this.tableHeader.length; i++) {
			var col = this.tableHeader[i]
			if (col.filter != undefined && col.filter['_value'] != undefined) {
				if (col.filter['type'] == 'dateRange') {
					// code...
				} else{
					this.logs  = this.filter.filterFunction(col.key , col.filter['_value'], this.logs);
				}
			}
		}
	};

	onSort(sortData){
		console.log('sortData', sortData);

    var col = sortData.key;
    var reverse = false;
    if (sortData.reverse == true) {
    	reverse = true
    }

    console.log(col, reverse);
    this.logs = this.sort.sortByColumn(col , reverse , function(x:any){return x;}, this.logs);
	};

	onFilterSelected(selectedList){
		console.log(selectedList)
		this.onFilter({})
		this.logs = this.filter.filterListFunction('logLevel' , selectedList, this.logs);
	}


  // sortColumn(column,order){
  //     var col = column.toLowerCase();     
  //     console.log(col);   
  //     if(order == 'true'){
  //         console.log('up'); 
  //         this.sort.sortByColumn(col , false , function(x:any){return x;});
  //     } else if(order == 'false') {
  //         console.log('down'); 
  //         this.sort.sortByColumn(col , true , function(x:any){return x;}); 
  //     }
  // };
  
  onServiceSearch(searchbar){
    this.logs  = this.filter.searchFunction("any" , searchbar);
  };

  constructor() { }

  ngOnInit() {
  	this.logs = this.logsData;
		this.filter = new Filter(this.logsData);
    this.sort = new Sort(this.logsData);
  }

}
