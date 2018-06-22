// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

var CronParser = function (argument) {
    return {
        cronObjFields: ["minutes", "hours", "dayOfMonth", "month", "dayOfWeek", "year"],
        isDefined: function (expression) {
            if (expression === undefined || expression === null) {
                return null;
            } else if (expression === "") {
                return null;
            } else {
                return true;
            }
        },
        regExp: {
            "minutes": /^(\?|\*|(?:[0-5]?\d)(?:(?:-|\/|\,)(?:[0-5]?\d))?(?:,(?:[0-5]?\d)(?:(?:-|\/|\,)(?:[0-5]?\d))?)*)$/,
            "hours": /^(\?|\*|(?:[01]?\d|2[0-3])(?:(?:-|\/|\,)(?:[01]?\d|2[0-3]))?(?:,(?:[01]?\d|2[0-3])(?:(?:-|\/|\,)(?:[01]?\d|2[0-3]))?)*)$/,
            "dayOfMonth": /^(\?|\*|(?:0?[1-9]|[12]\d|3[01])(?:(?:-|\/|\,)(?:0?[1-9]|[12]\d|3[01]))?(?:,(?:0?[1-9]|[12]\d|3[01])(?:(?:-|\/|\,)(?:0?[1-9]|[12]\d|3[01]))?)*)$/,
            "month": /^(\?|\*|(?:[1-9]|1[012])(?:(?:-|\/|\,)(?:[1-9]|1[012]))?(?:L|W)?(?:,(?:[1-9]|1[012])(?:(?:-|\/|\,)(?:[1-9]|1[012]))?(?:L|W)?)*|\?|\*|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)*)$/,
            "dayOfWeek": /^(\?|\*|(?:[0-6])(?:(?:-|\/|\,|#)(?:[0-6]))?(?:L)?(?:,(?:[0-6])(?:(?:-|\/|\,|#)(?:[0-6]))?(?:L)?)*|\?|\*|(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?(?:,(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?)*)$/,
            "year": /^([0-9,\/\*]|\*|\?\d)$/
        },
        validateField: function (field, expression) {
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
            };
            return undefined;
        },
        validateCron: function (cronObj) {
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
            };
            var isValid = function (cronValidity) {
                if (cronValidity.minutes && cronValidity.hours && cronValidity.dayOfMonth && cronValidity.month && cronValidity.dayOfWeek && cronValidity.year) {
                    return true;
                }
                return false;
            };
            cronValidity = {
                minutes: this.validateField("minutes", cronObj.minutes),
                hours: this.validateField("hours", cronObj.hours),
                dayOfMonth: this.validateField("dayOfMonth", cronObj.dayOfMonth),
                month: this.validateField("month", cronObj.month),
                dayOfWeek: this.validateField("dayOfWeek", cronObj.dayOfWeek),
                year: this.validateField("year", cronObj.year)
            };
            cronValidity.isValid = isValid(cronValidity);

            return cronValidity;
        },
        validateCronExpression: function (cronExpression) {
            var cronFields, cronObj, cronValidity, cronValidityMsg;
            if (cronExpression === "" || cronExpression === undefined || cronExpression === null) {
                return {
                    "result": "invalid",
                    "message": "Empty Cron expression."
                };
            };
            cronFields = cronExpression.split(" ");

            if (cronFields.length != this.cronObjFields.length) {
                return {
                    "result": "invalid",
                    "message": "Invalid Cron expression. " + this.cronObjFields.length + " fields required. Contains " + cronFields.length
                };
            } else {
                cronObj = {
                    "minutes": cronFields[0],
                    "hours": cronFields[1],
                    "dayOfMonth": cronFields[2],
                    "month": cronFields[3],
                    "dayOfWeek": cronFields[4],
                    "year": cronFields[5]
                };
                cronValidity = this.validateCron(cronObj);

                if (cronValidity.isValid == true) {
                    return {
                        "result": "valid",
                        "message": "Valid Cron expression."
                    };
                } else {

                    // Generate proper error msg.
                    cronValidityMsg = '';
                    for (var i = 0; i < this.cronObjFields.length; i++) {
                        if (cronValidity[this.cronObjFields[i]] == false) {
                            cronValidityMsg = cronValidityMsg + this.cronObjFields[i] + ', ';
                        };
                    };
                    if (cronValidityMsg != '') {
                        cronValidityMsg = 'Following fields are invalid : ' + cronValidityMsg;
                    };
                    return {
                        "result": "invalid",
                        "message": "Invalid Cron expression. " + cronValidityMsg
                    };
                }
            }
        },
        getCronExpression: function (cronObj) {
            if (cronObj == undefined || cronObj == null) {
                return undefined;
            } else {
                var cronObjFields = this.cronObjFields;
                var cronExpression = cronObj.minutes;
                for (var i = 1; i < cronObjFields.length; i++) {
                    cronExpression = cronExpression + " " + cronObj[cronObjFields[i]];
                };
                return cronExpression;
            }
        }
    }
}();


module.exports = CronParser
