import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {environment} from "../../../environments/environment";
import {EventExpression} from "../create-service/service-form-data";

@Component({
  selector: 'create-service-aws-events',
  templateUrl: './create-service-aws-events.component.html',
  styleUrls: ['./create-service-aws-events.component.scss']
})
export class CreateServiceAwsEventsComponent implements OnInit {
  @Input() type = 'awsEventsNone';
  @Output() setAWSEvents = new EventEmitter();


  public sqsQueueString: string = "arn:aws:sqs:" + environment.aws["region"] + ":" + environment.aws.account_number + ":table/";
  public kinesisStreamString: string = "arn:aws:kinesis:" + environment.aws["region"] + ":" + environment.aws.account_number + ":stream/";
  public dynamoStreamString: string = "arn:aws:dynamo:" + environment.aws["region"] + ":" + environment.aws.account_number + ":";

  eventExpression = new EventExpression(this.type, undefined, undefined, undefined, undefined);

  constructor() {
  }

  ngOnInit() {
  }

  setCreateServiceProperty() {
    if (this.type === 'awsEventsNone') {
      return this.setAWSEvents.emit(null);
    }
    let event = {
      type: this.type,
      source: '',
      action: ''
    };

    switch (this.type) {
      case 'dynamodb':
        event["source"] = this.dynamoStreamString + this.eventExpression.dynamoTable;
        event["action"] = "PutItem";
        break;
      case 'kinesis':
        event["source"] = this.kinesisStreamString + this.eventExpression.streamARN;
        event["action"] = "PutRecord";
        break;
      case 's3':
        event["source"] = this.eventExpression.S3BucketName;
        event["action"] = "S3:" + this.eventExpression.S3BucketName + ":*";
        break;
      case 'sqs':
        event["source"] = this.sqsQueueString + this.eventExpression.SQSQueueARN;
        break;
    }
    this.setAWSEvents.emit(this.eventExpression);
  }
}
