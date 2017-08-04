export class ServiceFormData {
  constructor(
    public serviceName: string,
    public domainName: string,
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
    public cronStr: string
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