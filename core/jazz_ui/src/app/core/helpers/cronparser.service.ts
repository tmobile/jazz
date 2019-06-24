/** 
  * @type Service 
  * @desc Cron Parser Service
  * @author
*/

import { Injectable } from '@angular/core';


@Injectable()
export class CronParserService {
    public cronObjFields: string[] = ['minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek', 'year'];
    public regExp: Object = {
        'minutes': /^(\?|\*|(?:[0-5]?\d)(?:(?:-|\/|\,)(?:[0-5]?\d))?(?:,(?:[0-5]?\d)(?:(?:-|\/|\,)(?:[0-5]?\d))?)*)$/,
        'hours': /^(\?|\*|(?:[01]?\d|2[0-3])(?:(?:-|\/|\,)(?:[01]?\d|2[0-3]))?(?:,(?:[01]?\d|2[0-3])(?:(?:-|\/|\,)(?:[01]?\d|2[0-3]))?)*)$/,
        'dayOfMonth': /^(\?|\*|\L|(?:0?[1-9]|[12]\d|3[01])(?:(?:-|\/|\,)(?:0?[1-9]|[12]\d|3[01]))?(?:,(?:0?[1-9]|[12]\d|3[01])(?:(?:-|\/|\,)(?:0?[1-9]|[12]\d|3[01]))?)*)$/,
        'month': /^(\?|\*|(?:[1-9]|1[012])(?:(?:-|\/|\,)(?:[1-9]|1[012]))?(?:L|W)?(?:,(?:[1-9]|1[012])(?:(?:-|\/|\,)(?:[1-9]|1[012]))?(?:L|W)?)*|\?|\*|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)*)$/,
        'dayOfWeek': /^(\?|\*|\L|(?:[0-6])(?:(?:-|\/|\,|#)(?:[0-6]))?(?:L)?(?:,(?:[0-6])(?:(?:-|\/|\,|#)(?:[0-6]))?(?:L)?)*|\?|\*|(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?(?:,(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?)*)$/,
        'year': /^([0-9,\/\*]|\*|\?\d)$/
    }


    constructor() {
    }

    isDefined(expression: string):any {
        if (expression === undefined || expression === null) {
            return null;
        } else if (expression ==='') {
            return null;
        } else {
            return true;
        }
    }

    validateField(field: string, expression: string): any {
        if (this.cronObjFields.indexOf(field) >= 0) {
            if (this.isDefined(expression)) {
                var regxp = this.regExp[field];
                // if (expression.match( regxp)) {
                if ((regxp.test(expression))) {
                    return true;
                } else {
                    return false;
                }
            }
            return null;
        }
        return undefined;
    }

    validateCron(cronObj: any): any {
        if ((cronObj.dayOfMonth !== '?' && cronObj.dayOfWeek === '?') || (cronObj.dayOfMonth === '?' && cronObj.dayOfWeek !== '?')) {
        var cronValidity = {};
        if (cronObj === undefined || cronObj === null) {
            cronValidity = {
                minutes: false,
                hours: false,
                dayOfMonth: false,
                month: false,
                dayOfWeek: false,
                year: false,
                isValid: false
            };
            return cronValidity;
        }
        var isValid = function(cronValidity) {
            if (cronValidity.minutes && cronValidity.hours && cronValidity.dayOfMonth && cronValidity.month && cronValidity.dayOfWeek && cronValidity.year) {
                return true;
            }
            return false;
        };
        cronValidity = {
            minutes: this.validateField('minutes', cronObj.minutes),
            hours: this.validateField('hours', cronObj.hours),
            dayOfMonth: this.validateField('dayOfMonth', cronObj.dayOfMonth),
            month: this.validateField('month', cronObj.month),
            dayOfWeek: this.validateField('dayOfWeek', cronObj.dayOfWeek),
            year: this.validateField('year', cronObj.year)
        };
        cronValidity['isValid'] = isValid(cronValidity);

        return cronValidity;
    }  
       else {
           return false;
       }
    }
    public getCronExpression(cronObj: any): any {
        if (cronObj === undefined || cronObj === null) {
            return undefined;
        } else {
            var cronObjFields = this.cronObjFields;
            var cronExpression = cronObj.minutes;
            for (var i = 1; i < cronObjFields.length; i++) {
                cronExpression = cronExpression + ' ' + cronObj[cronObjFields[i]];
            }
            return cronExpression;
        }
    }
}

