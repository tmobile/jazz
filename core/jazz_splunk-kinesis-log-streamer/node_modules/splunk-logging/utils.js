/**
 * Utility functions.
 * @exports utils
 */
var utils = {};
/*
 * Copyright 2015 Splunk, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"): you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */


/* Utility Functions */

/**
 * Formats the time for Splunk Enterprise or Splunk Cloud as a the epoch time in seconds.
 *
 * @param {(string|number|date)} time - A date string, timestamp, or <code>Date</code> object.
 * @returns {number|null} Epoch time in seconds, or <code>null</code> if <code>time</code> is malformed.
 * @static
 */
utils.formatTime = function(time) {
    var cleanTime;
    
    // If time is a Date object, return its value.
    if (time instanceof Date) {
        time = time.valueOf();
    }

    if (!time || time === null) {
        return null;
    }

    // Values with decimals
    if (time.toString().indexOf(".") !== -1) {
        cleanTime = parseFloat(time).toFixed(3); // Clean up the extra decimals right away.

        // A perfect time in milliseconds, with the decimal in the right spot.
        if (cleanTime.toString().indexOf(".") >= 10) {
            cleanTime = parseFloat(cleanTime.toString().substring(0, 14)).toFixed(3);
        }
    }
    // Values without decimals
    else {
        // A time in milliseconds, no decimal (ex: Date.now()).
        if (time.toString().length === 13) {
            cleanTime = (parseFloat(time) / 1000).toFixed(3);
        }
        // A time with fewer than expected digits.
        else if (time.toString().length <= 12) {
            cleanTime = parseFloat(time).toFixed(3);
        }
        // Any other value has more digits than the expected time format, get the first 14.
        else {
            cleanTime = parseFloat(time.toString().substring(0, 13)/1000).toFixed(3);
        }
    }
    return cleanTime;
};

/**
 * Converts an iterable into to an array.
 *
 * @param {(Array|Object)} iterable - Thing to convert to an <code>Array</code>.
 * @returns {Array}
 * @static
 */
utils.toArray = function(iterable) {
    return Array.prototype.slice.call(iterable);
};

// TODO: this isn't used anymore, remove it
/**
 * Run async function in a chain, like {@link https://github.com/caolan/async#waterfall|Async.waterfall}.
 *
 * @param {(function[]|function)} tasks - <code>Array</code> of callback functions.
 * @param {function} [callback] - Final callback.
 * @static
 */
utils.chain = function(tasks, callback) {
    // Allow for just a list of functions
    if (arguments.length > 1 && typeof arguments[0] === "function") {
        var args = utils.toArray(arguments);
        tasks = args.slice(0, args.length - 1);
        callback = args[args.length - 1];
    }

    tasks = tasks || [];
    callback = callback || function() {};

    if (tasks.length === 0) {
        callback();
    }
    else {
        var nextTask = function(task, remainingTasks, result) {
            var taskCallback = function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    var args = utils.toArray(arguments);
                    args.shift();
                    nextTask(remainingTasks[0], remainingTasks.slice(1), args);
                }
            };

            var args = result;
            if (remainingTasks.length === 0) {
                args.push(callback);
            }
            else {
                args.push(taskCallback);
            }

            task.apply(null, args);
        };

        nextTask(tasks[0], tasks.slice(1), []);
    }
};

/**
 * Asynchronous while loop.
 *
 * @param {function} [condition] - A function returning a boolean, the loop condition.
 * @param {function} [body] - A function, the loop body.
 * @param {function} [callback] - Final callback.
 * @static
 */
utils.whilst = function (condition, body, callback) {
    condition = condition || function() { return false; };
    body = body || function(done){ done(); };
    callback = callback || function() {};

    var wrappedCallback = function(err) {
        if (err) {
            callback(err);
        }
        else {
            utils.whilst(condition, body, callback);
        }
    };

    if (condition()) {
        body(wrappedCallback);
    }
    else {
        callback(null);
    }
};

/**
 * Waits using exponential backoff.
 *
 * @param {object} [opts] - Settings for this function. Expected keys: attempt, rand.
 * @param {function} [callback] - A callback function: <code>function(err, timeout)</code>.
 */
utils.expBackoff = function(opts, callback) {
    callback = callback || function(){};
    if (!opts || typeof opts !== "object") {
        callback(new Error("Must send opts as an object."));
    }
    else if (opts && !opts.hasOwnProperty("attempt")) {
        callback(new Error("Must set opts.attempt."));
    }
    else {

        var min = 10;
        var max = 1000 * 60 * 2; // 2 minutes is a reasonable max delay

        var rand = Math.random();
        if (opts.hasOwnProperty("rand")) {
            rand = opts.rand;
        }
        rand++;

        var timeout = Math.round(rand * min * Math.pow(2, opts.attempt));

        timeout = Math.min(timeout, max);
        setTimeout(
            function() {
                callback(null, timeout);
            },
            timeout
        );
    }
};

/**
 * Binds a function to an instance of an object.
 *
 * @param {object} [self] - An object to bind the <code>fn</code> function parameter to.
 * @param {object} [fn] - A function to bind to the <code>self</code> argument.
 * @returns {function}
 * @static
 */
utils.bind = function(self, fn) {
    return function () {
        return fn.apply(self, arguments);
    };
};

/**
 * Copies all properties into a new object which is returned.
 *
 * @param {object} [obj] - Object to copy properties from.
 */
utils.copyObject = function(obj) {
    var ret = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
};

/**
 * Copies all elements into a new array, which is returned.
 *
 * @param {array} [arr] - Array to copy elements from.
 * @returns {array}
 * @static
 */
utils.copyArray = function(arr) {
    var ret = [];
    for (var i = 0; arr && i < arr.length; i++) {
        ret[i] = arr[i];
    }
    return ret;
};

/**
 * Takes a property name, then any number of objects as arguments
 * and performs logical OR operations on them one at a time
 * Returns true as soon as a truthy
 * value is found, else returning false.
 *
 * @param {string} [prop] - property name for other arguments.
 * @returns {boolean}
 * @static
 */
utils.orByProp = function(prop) {
    var ret = false;
    for (var i = 1; !ret && i < arguments.length; i++) {
        if (arguments[i]) {
            ret = ret || arguments[i][prop];
        }
    }
    return ret;
};

/**
 * Like <code>utils.orByProp()</code> but for a falsey property.
 * The first argument after <code>prop</code> with that property
 * defined will be returned.
 * Useful for Booleans and numbers.
 *
 * @param {string} [prop] - property name for other arguments.
 * @returns {boolean}
 * @static
 */
utils.orByFalseyProp = function(prop) {
    var ret = null;
    // Logic is reversed here, first value wins
    for (var i = arguments.length - 1; i > 0; i--) {
        if (arguments[i] && arguments[i].hasOwnProperty(prop)) {
            ret = arguments[i][prop];
        }
    }
    return ret;
};

 /**
  * Tries to validate the <code>value</code> parameter as a non-negative
  * integer.
  *
  * @param {number} [value] - Some value, expected to be a positive integer.
  * @param {number} [label] - Human readable name for <code>value</code>
  * for error messages.
  * @returns {number}
  * @throws Will throw an error if the <code>value</code> parameter cannot by parsed as an integer.
  * @static
  */
utils.validateNonNegativeInt = function(value, label) {
    value = parseInt(value, 10);
    if (isNaN(value)) {
        throw new Error(label + " must be a number, found: " + value);
    }
    else if (value < 0) {
        throw new Error(label + " must be a positive number, found: " + value);
    }
    return value;
};

module.exports = utils;
