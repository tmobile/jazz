var app = angular.module('App', []);

app.controller('Ctrl', function($scope, $http, $document) {
    $scope.count = 0;
    $scope.selected = true;
    $scope.showSlctBxOptions = false;
    $scope.selectedRuntime = "";
    $scope.success = true;
    $scope.options = ["nodejs", "java", "python"];
    $scope.rateExpression = {};
    $scope.processing = false;
    $scope.serviceNameRegex = "^[A-Za-z0-9\-]+$";
    $scope.channelNameRegex = "^[A-Za-z0-9\-_]+$";
    // $scope.ttlRegex = "/^\d+$/";

    $scope.auto = false;
    $scope.$watch('memberSearch', function(newVal, oldVal) {
        if (newVal !== undefined && newVal !== oldVal && newVal !== "") {
            $scope.auto = true;
        } else {
            $scope.auto = false;
        }
    });

    $scope.$watch('service', function(newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.isServiceChanged = true;
        }
    })
    $scope.$watch('domain', function(newVal, oldVal) {
        if (newVal !== oldVal) {
            // Since service availability also depends on domain
            $scope.isServiceChanged = true;
        }
    })

    $scope.autoChange = function() {
        if ($scope.memberSearch !== "") {
            $scope.auto = true;
        } else {
            $scope.auto = false;
        }
    };

    $scope.approversAvailble = true;

    $scope.getApprovers = function() {
        var getApproversUrl = "https://cloud-api.corporate.slf.com/api/platform/ad/users";
        $http.get(getApproversUrl).then(function(response) {
            $scope.approversAvailble = true;
            var resultObj = response.data;
            if (resultObj.data !== undefined) {
                $scope.Names = resultObj.data.values;
                console.log("fetched ",$scope.Names.length," users");
            } else{
                console.error("ERROR! fetching users list",resultObj);
            }
        }, function(error) {
            $scope.approversAvailble = false;
            console.log("ERROR! fetching users list");
        });
    };

   // $scope.getApprovers();


    $scope.memberSearch = '';

    $scope.selectedApprovers = [];

    $scope.cut = function(index, val) {
        console.log('index ', index);
        console.log('val ', val);
        console.log("$scope.selectedApprovers ", $scope.selectedApprovers);
        if (index > -1) {
            $scope.selectedApprovers.splice(index, 1);
        }
        $scope.count--;
        $scope.inputLength = 0;
        for (var i = $scope.selectedApprovers.length - 1; i >= 0; i--) {
            $scope.inputLength = $scope.inputLength + $scope.selectedApprovers[i].length;
        }
        console.log($scope.inputLength);
        $scope.finalLength = (18 * $scope.count) + ($scope.inputLength * 8);
        console.log($scope.finalLength);

        $scope.css = {
            "padding-left": $scope.finalLength + 'px'
        };

    };
    $scope.finalLength = 0;

    var closeDropdown = function(argument) {


        $scope.$apply(function() {
            $scope.auto = false;

            if ($scope.showSlctBxOptions === true) {
                $scope.toggleOptions();
            }
        });
    };

    $document.on('click', closeDropdown);


    $scope.go = function(val) {
        $scope.auto = false;

        $scope.memberSearch = " ";

        var isExists = false;
        for (var i = 0; i < $scope.selectedApprovers.length; i++) {
            if ($scope.selectedApprovers[i] == val) {
                isExists = true;
                break;
            }
        }
        if (isExists === true || val === undefined) {
            return;
        }
        $scope.selectedApprovers.push(val);
        $scope.inputLength = 0;
        for (var i = $scope.selectedApprovers.length - 1; i >= 0; i--) {
            $scope.inputLength = $scope.inputLength + $scope.selectedApprovers[i].givenName.length;
        }
        $scope.count++;
        console.log($scope.auto);
        $scope.finalLength = (22 * $scope.count) + ($scope.inputLength * 10);
        $scope.css = {
            "padding-left": $scope.finalLength + 'px'
        };
    };

    $scope.CronParser = {
        cronObjFields: ['minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek', 'year'],
        isDefined: function(expression) {
            if (expression === undefined || expression === null) {
                return null;
            } else if (expression ==='') {
                return null;
            } else {
                return true;
            }
        },
        regExp: {
            'minutes': /^(\?|\*|(?:[0-5]?\d)(?:(?:-|\/|\,)(?:[0-5]?\d))?(?:,(?:[0-5]?\d)(?:(?:-|\/|\,)(?:[0-5]?\d))?)*)$/,
            'hours': /^(\?|\*|(?:[01]?\d|2[0-3])(?:(?:-|\/|\,)(?:[01]?\d|2[0-3]))?(?:,(?:[01]?\d|2[0-3])(?:(?:-|\/|\,)(?:[01]?\d|2[0-3]))?)*)$/,
            'dayOfMonth': /^(\?|\*|(?:0?[1-9]|[12]\d|3[01])(?:(?:-|\/|\,)(?:0?[1-9]|[12]\d|3[01]))?(?:,(?:0?[1-9]|[12]\d|3[01])(?:(?:-|\/|\,)(?:0?[1-9]|[12]\d|3[01]))?)*)$/,
            'month': /^(\?|\*|(?:[1-9]|1[012])(?:(?:-|\/|\,)(?:[1-9]|1[012]))?(?:L|W)?(?:,(?:[1-9]|1[012])(?:(?:-|\/|\,)(?:[1-9]|1[012]))?(?:L|W)?)*|\?|\*|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)*)$/,
            'dayOfWeek': /^(\?|\*|(?:[0-6])(?:(?:-|\/|\,|#)(?:[0-6]))?(?:L)?(?:,(?:[0-6])(?:(?:-|\/|\,|#)(?:[0-6]))?(?:L)?)*|\?|\*|(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?(?:,(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?)*)$/,
            'year': /^([0-9,\/\*]|\*|\?\d)$/
        },
        validateField: function(field, expression) {
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
        },
        validateCron: function(cronObj) {
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
            cronValidity.isValid = isValid(cronValidity);

            return cronValidity;
        },
        getCronExpression: function(cronObj) {
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
    };


    $scope.isFormDisabled = function(form) {
        if (form.$pristine || form.$invalid) {
            return true;
        }

        if (($scope.api || $scope.lambda) && $scope.selected) {
            // the dropdown should be selected for api/lambda
            return true;
        }

       /* if ($scope.selectedApprovers === undefined || $scope.selectedApprovers.length === 0) {
            return true;
        }*/
        /*if (!$scope.serviceNameAvailable) {
            return true;
        }*/
        /*if ($scope.parentObject.slackSelected && !$scope.channelNameAvailable) {
            return true
        }*/
        return false;
    };

    $scope.generateExpression = function(rateExpression) {
        if ($scope.rateExpression !== undefined) {
            $scope.rateExpression.error = undefined;
        }
        if (rateExpression === undefined || rateExpression.type === '') {
            $scope.rateExpression.isValid = undefined;
        } else if (rateExpression.type == 'rate') {
            var duration, interval;
            duration = rateExpression.duration;
            interval = rateExpression.interval;

            if (duration === undefined || duration === null || duration <= 0) {
                $scope.rateExpression.isValid = false;
                $scope.rateExpression.error = 'Please enter a valid duration';
            } else {
                if (interval == 'Minutes') {
                    $scope.rateExpression.cronObj = {
                        minutes: '0/' + duration,
                        hours: '*',
                        dayOfMonth: '*',
                        month: '*',
                        dayOfWeek: '?',
                        year: '*'
                    };
                } else if (interval == 'Hours') {
                    $scope.rateExpression.cronObj = {
                        minutes: '0',
                        hours: '0/' + duration,
                        dayOfMonth: '*',
                        month: '*',
                        dayOfWeek: '?',
                        year: '*'
                    };
                } else if (interval == 'Days') {
                    $scope.rateExpression.cronObj = {
                        minutes: '0',
                        hours: '0',
                        dayOfMonth: '1/' + duration,
                        month: '*',
                        dayOfWeek: '?',
                        year: '*'
                    };
                }
                $scope.rateExpression.isValid = true;
                // $scope.rateExpression.rateStr = 'rate(' + duration + ' ' + interval + ')';
                $scope.rateExpression.cronStr = $scope.CronParser.getCronExpression($scope.rateExpression.cronObj);
            }
        } else if (rateExpression.type == 'cron') {
            var cronExpression;
            var cronObj = $scope.rateExpression.cronObj;
            var cronObjFields = ['minutes', 'hours', 'dayOfMonth', 'month', 'dayOfWeek', 'year'];

            cronExpression = $scope.CronParser.getCronExpression(cronObj);

            var isCronExpressionValid = function(cronExpression) {
                var cronValidity = $scope.CronParser.validateCron(cronObj);
                if (cronValidity.isValid === true) {
                    return true;
                }
                return false;
                // if (cronExpression === undefined || cronExpression === null || cronExpression == '') {
                //     return false;
                // }
                // return true;
            };

            if (isCronExpressionValid(cronExpression) === false) {
                $scope.rateExpression.isValid = false;
                $scope.rateExpression.error = 'Please enter a valid cron expression';
            } else {
                $scope.rateExpression.isValid = true;
                // $scope.rateExpression.rateStr = 'cron(' + cronExpression + ')';
                $scope.rateExpression.cronStr = $scope.CronParser.getCronExpression($scope.rateExpression.cronObj);
            }
        }

        if ($scope.rateExpression.isValid === undefined) {
            return undefined;
        } else if ($scope.rateExpression.isValid === false) {
            return 'invalid';
        } else if ($scope.rateExpression.isValid === true) {
            return $scope.rateExpression.cronStr;
        }
    };

    $scope.isLoginFormDisabled = function(form) {
        if (form.$invalid) {
            return true;
        }
        return false;
    };
    $scope.checkDomain = function(){
        if (!$scope.domain) {
            return;
        } else {
            $scope.domain = $scope.domain.toLowerCase();
            if($scope.domainHiphenValidation){
                return;
            }
           // $scope.checkNameAvailability();
        }
    };

    $scope.checkNameAvailability = function(callback) {
        if (!$scope.service) {
            return;
        }
        if ($scope.hiphenValidation) {
            return;
        }

        $scope.service = $scope.service.toLowerCase();

        if ($scope.domain) {
            $scope.domain = $scope.domain.toLowerCase();
            var payload = {
            		"service_type":"api",
            		"service_name":$scope.service,
            		"runtime":$scope.selectedRuntime,
            		"approvers":"NONE",
            		"domain":$scope.domain,
            		"username":"bitbucket",
            		"slack_channel":"",
            		"require_internal_access":"",
            		"rateExpression":"",
            		"enableEventSchedule":"false"
            		};
            $scope.isDomainDefined = true;
        } else{
            var payload = {
            		"service_type":"api",
            		"service_name":$scope.service,
            		"runtime":$scope.selectedRuntime,
            		"approvers":"NONE",
            		"domain":$scope.domain,
            		"username":"bitbucket",
            		"slack_channel":"",
            		"require_internal_access":"",
            		"rateExpression":"",
            		"enableEventSchedule":"false"
            		};
            $scope.isDomainDefined = false;
        }
        
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://{inst_API_KEY}.execute-api.{inst_region}.amazonaws.com/dev/platform/createservice",
            "method": "POST",
            "headers": {
                    "content-type": "application/json"                    	
            },
            "data": JSON.stringify(payload)
        };

        $scope.showServiceNameLoader = true;
        $.ajax(settings).done(function(response) {
        	
        	$scope.$apply(function() {
        		
                $scope.isServiceChanged = false;
                $scope.showServiceNameLoader = false;
                /*if (response.data.available === true) {
                    $scope.serviceNameAvailable = true;
                    $scope.serviceNameUnavailable = false;
                } else if (response.data.available === false) {
                    $scope.serviceNameUnavailable = true;
                    $scope.serviceNameAvailable = false;
                } else {
                    $scope.serviceNameError = true;
                    $scope.serviceNameAvailable = false;
                }*/
                
                $scope.loader = false;
                $scope.success = true;
                $scope.value = true;
                $scope.hideOverlay();
                $scope.processing = false;
                
                if (response !== undefined && response.data !== undefined) {
                    var index = response.data.indexOf("http://");
                    $scope.link = response.data.slice(index, response.data.length);
                }
                console.log($scope.link);

                if (typeof callback === "function") {
                	$scope.serviceNameAvailable = true;
                    $scope.serviceNameUnavailable = false;
                    callback($scope.serviceNameAvailable);
                }
            });
            
        }).fail(function() {
            $scope.$apply(function() {
                $scope.isServiceChanged = false;

                $scope.showServiceNameLoader = false;
                $scope.serviceNameError = true;
                $scope.serviceNameAvailable = false;
                console.log(3)
                if (typeof callback === "function") {
                    callback(false);
                }
                console.log('Failed to check name availability');
            });
        });
    };

    $scope.resetValidation = function(){
        if($scope.validationInitiated){
            $scope.validationInitiated = false;
            $scope.channelNameAvailable = false;
            $scope.channelNameUnavailable = false;
            $scope.channelNameError = false;
        }
    };

    $scope.validationInitiated = false;
    $scope.checkChannelAvailability = function() {
        if (!$scope.parentObject.channelname) {
            return;
        }
        $scope.validatingChannel = true;
        $scope.validationInitiated = true;
        $scope.parentObject.channelname = $scope.parentObject.channelname.toLowerCase();
        var payload = {
            "slack_channel": $scope.parentObject.channelname
        };
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://cloud-api.corporate.slf.com/api/platform/is-slack-channel-available",
            "method": "GET",
            "headers": {
                "content-type": "application/json"
            },
            "data": payload
        };

        $.ajax(settings).done(function(response) {
            $scope.$apply(function() {
                $scope.validatingChannel = false;
                if (response.data.is_available === true) {
                    $scope.channelNameAvailable = true;
                    $scope.channelNameUnavailable = false;
                } else if (response.data.is_available === false) {
                    $scope.channelNameUnavailable = true;
                    $scope.channelNameAvailable = false;
                } else {
                    $scope.channelNameError = true;
                }
            });
        }).fail(function() {
            $scope.$apply(function() {
                $scope.validatingChannel = false;
                $scope.serviceNameError = true;
                console.log('Failed to check name availability');
            });
        });
    };

    $scope.value = false;
    $scope.overlayActive = false;
    $scope.parentObject = {};
    $scope.parentObject.vpcSelected = false;

    $scope.initialSubmit = function(isValid) {
        // $scope.overlayActive = true;
    	
        if ($scope.isServiceChanged) {
            $scope.checkNameAvailability(function(isValid) {
               /* if (isValid === true) {
                    $scope.overlayActive = true;
                } else {
                    // service name is invalid
                }*/
            })
        } else{
           // $scope.overlayActive = true;
        }

        
    };

    $scope.validateServiceName = function(){
        if($scope.service && $scope.service.indexOf("--") >=0){
           $scope.form.servicename.$setValidity("username", false);
           $scope.hiphenValidation = true;
        } else {
            $scope.form.servicename.$setValidity("username", true);
            $scope.hiphenValidation = false;
        }
    }

    $scope.validateDomainName = function(){
        if($scope.domain && $scope.domain.indexOf("--") >=0){
           $scope.form.domain.$setValidity("domain", false);
           $scope.domainHiphenValidation = true;
        } else {
            $scope.form.domain.$setValidity("domain", true);
            $scope.domainHiphenValidation = false;
        }
    }

    $scope.submit = function(isValid) {

        if (!$scope.overlayActive) {
            $scope.overlayActive = true;
            return;
        }

        var url, payload = {},
            approvers = [],
            rateExpression;
        for (var i = $scope.selectedApprovers.length - 1; i >= 0; i--) {
            approvers.push($scope.selectedApprovers[i].userId);
        }
        if ($scope.api === true) {
            payload = {
                "service_type": "api",
                "service_name": $scope.service,
                "runtime": $scope.selectedRuntime,
                "approvers": approvers,
                "username": $scope.parentObject.username,
                "password": $scope.parentObject.userPassword,
                "domain": $scope.domain
            };
        } else if ($scope.lambda === true) {
            payload = {
                "service_type": "lambda",
                "service_name": $scope.service,
                "runtime": $scope.selectedRuntime,
                "approvers": approvers,
                "username": $scope.parentObject.username,
                "password": $scope.parentObject.userPassword,
                "domain": $scope.domain
            };

            rateExpression = $scope.generateExpression($scope.rateExpression);
            if (rateExpression == 'invalid') {
                console.log('ERROR: ', $scope.rateExpression.error);
                return;
            } else if (rateExpression !== undefined) {
                payload["rateExpression"] = rateExpression;
            }

        } else if ($scope.static === true) {
            // by_default_cloudfront url wont be created
            var create_cloudfront_url = $scope.parentObject.createCloudfrontUrl || false;

            console.log("create_cloudfront_url",create_cloudfront_url);
            payload = {
                "service_type": "website",
                "service_name": $scope.service,
                "runtime": $scope.selectedRuntime,
                "approvers": approvers,
                "username": $scope.parentObject.username,
                "password": $scope.parentObject.userPassword,
                "domain": $scope.domain,
                "create_cloudfront_url" : create_cloudfront_url
            };
        }

        if($scope.api || $scope.lambda){
            payload.require_internal_access = $scope.parentObject.vpcSelected;
        }
        if($scope.parentObject.slackSelected){
            payload.slack_channel = $scope.parentObject.channelname;
        }
        if($scope.parentObject.ttlSelected && $scope.api){
            payload.cache_ttl = $scope.parentObject.ttlDet;
        }
        console.log("service payload" + JSON.stringify(payload));
        url = "https://cloud-api.corporate.slf.com/api/platform/service-onboarding-facade";
        console.log(isValid, $scope.selectedRuntime);
        if (isValid && ($scope.selectedRuntime !== "" || $scope.static === true)) {
            console.log(isValid);
            $scope.value = false;
            $scope.loader = true;
            $scope.processing = true;
            
            console.log("url" + url);
            console.log("payload" + payload);
            // $http.post( url, payload)
            //     .success( function( data, status, headers ) {
            //         console.log( JSON.stringify( data ) );
            //         $scope.link = data;
            //         $scope.loader = false;
            //     } );

            // $http.post( url, payload)
            //     .success( function( data, status, headers ) {
            //         console.log( JSON.stringify( data ) );
            //         $scope.link = data;
            //         $scope.loader = false;
            //     } );

            var settings = {
                "async": true,
                "crossDomain": true,
                "url": url,
                "method": "POST",
                "headers": {
                    "content-type": "application/json"
                },
                "data": JSON.stringify(payload)
            };
           
            $.ajax(settings).done(function(response) {

                $scope.$apply(function() {

                    $scope.loader = false;
                    $scope.success = true;
                    $scope.value = true;
                    $scope.hideOverlay();
                    $scope.processing = false;
                    if (response !== undefined && response.data !== undefined) {
                        var index = response.data.create_service.data.indexOf("https://");
                        $scope.link = response.data.create_service.data.slice(index, response.data.length);
                    }
                    console.log($scope.link);
                });
            }).fail(function(jqXHR, textStatus, errorThrown) {
                $scope.$apply(function() {
                    $scope.processing = false;
                    if (jqXHR.status == 401 || jqXHR.status == 403) {
                        $scope.showErrorMsg = true;
                    } else {
                        $scope.loader = false;
                        $scope.value = true;
                        $scope.hideOverlay();
                        $scope.success = false;

                    }
                });
            });
        }
    };
    $scope.reload = function() {
        location.reload();
    };
    $scope.submitBack = function() {
        $scope.value = false;
    };



    $scope.changelambda = function() {
        $scope.api = false;
        $scope.lambda = true;
        $scope.static = false;
        // $scope.emptyForm();
    };

    $scope.changestatic = function() {
        $scope.api = false;
        $scope.lambda = false;
        $scope.static = true;
        // $scope.emptyForm();
    };

    $scope.changeapi = function() {
        $scope.api = true;
        $scope.lambda = false;
        $scope.static = false;
        // $scope.emptyForm();
    };

    $scope.toggleOptions = function($event) {

        if ($event) {
            $event.stopPropagation();
        }

        $scope.showSlctBxOptions = !$scope.showSlctBxOptions;
    };

    $scope.groupFunc = function(option) {
        $scope.selected = false;
        $scope.selectedRuntime = option;
    };

    $scope.emptyForm = function() {
        $scope.service = "";
        $scope.domain = "";
        $scope.selectedRuntime = "";
        $scope.selectedApprovers = [];
    };
    $scope.hide = function() {
        $scope.auto = false;
    };

    $scope.changeapi();

    $scope.hideOverlay = function() {
        $scope.overlayActive = false;
    };

    $scope.submitLogin = function(isValid) {
        //$scope.hideOverlay();
    };

    $scope.hideError = function() {
        $scope.showErrorMsg = false;
    };

});


app.directive('numbersOnly', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {
            function fromUser(text) {
                if (text) {
                    var transformedInput = text.replace(/[^0-9]/g, '');
                    if(transformedInput.indexOf("0") == 0){
                        transformedInput = transformedInput.slice(0,0);
                    }
                    if (transformedInput.length > 4) {
                       transformedInput = transformedInput.slice(0,4);
                    }

                    if(parseInt(transformedInput) > 3600) {
                        transformedInput = transformedInput.slice(0,3);
                    }

                    if (transformedInput != text) {
                        ngModelCtrl.$setViewValue(transformedInput);
                        ngModelCtrl.$render();
                    }
                    return transformedInput;
                }
                return undefined;
            }            
            ngModelCtrl.$parsers.push(fromUser);
        }
    };
});


app.directive('clickAnywhereButHere', ['$document', function($document) {
    return {
        link: function postLink(scope, element, attrs) {
            var onClick = function(event) {
                var isChild = $(element).has(event.target).length > 0;
                var isSelf = element[0] == event.target;
                var isInside = isChild || isSelf;
                if (!isInside) {
                    scope.$apply(attrs.clickAnywhereButHere);
                }
            };
            scope.$watch(attrs.isActive, function(newValue, oldValue) {
                if (newValue !== oldValue && newValue === true) {
                    $document.bind('click', onClick);
                } else if (newValue !== oldValue && newValue === false) {
                    $document.unbind('click', onClick);
                }
            });
        }
    };
}]);
