import {Injectable} from '@angular/core';
import {RequestService} from "../core/services";
import {Observable} from "rxjs/Observable";
import {UtilsService} from "../core/services/utils.service";

declare let Promise: any;

@Injectable()
export class CreateServiceUtilsService {

  constructor(private http: RequestService,
              private utils: UtilsService) {
  }


  createServerlessService(createServicePayload) {
    let url = '/jazz/create-serverless-service';
    return this.http.post(url, createServicePayload)
      .toPromise()
      .then((response) => {
        return response;
      })
      .catch((error) => {
        return Promise.reject(error);
      })
  }

  validateSlackChannelAvailable(slackName) {
    let url = '/is-slack-channel-available'
    return this.http.get(url, {
      'slack_channel': slackName
    })
      .toPromise()
      .then((response: any) => {
        return response.data.available;
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  validateServiceNameAvailable(serviceName, namespace) {
    let url = '/jazz/is-service-available/';
    return this.http.get(url, {
      service: serviceName,
      domain: namespace
    })
      .toPromise()
      .then((response: any) => {
        return response.data.available;
      })
      .catch((error) => {
        return Promise.reject(error);
      })
  }


  defineServiceTypesRadio() {
    return [{label: 'API', value: 'api', icon: 'icon-icon-api'},
      {label: 'LAMBDA', value: 'function', icon: 'icon-icon-function'},
      {label: 'WEBSITE', value: 'website', icon: 'icon-icon-web'}]
  }

  definePlatformsRadio() {
    return [
      {label: 'AWS', value: 'aws', icon: 'icon-icon-AWS', template: this.utils.getAWSIcon()},
      {label: 'Azure', value: 'azure', icon: 'icon-icon-azure', disabled: true},
      {label: 'Google Cloud', value: 'gcloud', icon: 'icon-icon-googlecloud', disabled: true}
    ]
  }

  defineRuntimeRadio() {
    return [
      {label: 'Nodejs (6.10)', value: 'nodejs', disabled: false},
      {label: 'Java 8', value: 'java', disabled: false},
      {label: 'Python (2.7)', value: 'python', disabled: false},
      {label: 'C#', value: 'cshell', disabled: true}
    ]
  }

  defineEventScheduleRadio() {
    return [
      {label: 'None', value: 'none'},
      {label: 'Fixed Rate of', value: 'rate'},
      {label: 'Cron Expression', value: 'cron'}
    ]
  }

  defineAWSEventsRadio() {
    return [
      {label: 'None', value: 'awsEventsNone'},
      {label: 'DynamoDB', value: 'dynamodb'},
      {label: 'Kinesis', value: 'kinesis'},
      {label: 'S3', value: 's3'},
      {label: 'SQS', value: 'sqs'}
    ]
  }
}
