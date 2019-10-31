export class ServiceFormData {
  constructor(
    public serviceName: string,
    public domainName: string,
    public serviceDescription: string,
    public approverName: string,
    public slackName: string,
    public ttlValue: string

    // public rateMinute: string,
    // public rateHour: string,
    // public rateDayofMonth: string,
    // public rateMonth: string,
    // public rateDayOfWeek: string,
    // public rateYear: string
  ) {  }
}
export class RateExpression {
  constructor(
    public error: string,
    public isValid: boolean,
    public type: string,
    public duration: string,
    public interval: string,
    public cronStr: string,
    public rateStr: string
  ) {  }
}

export class CronObject {
  constructor(
    public minutes: string,
    public hours: string,
    public dayOfMonth: string,
    public month: string,
    public dayOfWeek: string,
    public year: string
  ) {  }
}

export class EventExpression {
  constructor(
    public type: string,
    public dynamoTable: string,
    public streamARN: string,
    public S3BucketName: string,
    public SQSstreamARN: string,
  ) {  }
}

export class AzureEventExpression {
  constructor (
    public type:string,
    public cosmosdb: string,
    public eventhub: string,
    public storageaccount: string,
    public servicebusqueue: string
  ){}
}

export class EventLabels {
  constructor(
  	public functionLabel: string,
    public databaseLabel: string,
    public databaseNameLabel: string,
    public streamLabel: string,
    public streamNameLabel: string,
    public storageLabel: string,
    public storageNameLabel: string,
    public queueLabel: string,
    public queueNameLabel: string,

  ) {  }
}
export class AzureEventLabels {
  constructor (
    public azurefunctionLabel: string,
    public azuredatabaseLabel: string,
    public azuredatabaseNameLabel: string,
    public azurestreamLabel: string,
    public azurestreamNameLabel: string,
    public azurestorageLabel: string,
    public azurestorageNameLabel: string,
    public azurequeueLabel: string,
    public azurequeueNameLabel: string
  ){}
}
