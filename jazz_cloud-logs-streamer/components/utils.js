/**
    Helper functions for Cloud Logs Streamer
  @module: utils.js
  @description: Helper functions for using Regex patterns, etc.
  @author: SIDD
  @version: 1.0
**/

const crypto = require('crypto');
const logger = require("../components/logger.js"); 

logger.setLevel('debug');

// Helper functions

var extractJson = function(message) {
    var jsonStart = message.indexOf('{');
    if (jsonStart < 0) return null;
    var jsonSubString = message.substring(jsonStart);
    return isValidJson(jsonSubString) ? jsonSubString : null;
}

var isNumeric = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

var isValidJson = function(message) {
    try {
        JSON.parse(message);
    } catch (e) { return false; }
    return true;
}


var getInfo = function(messages, patternStr) {
	var pattern = new RegExp(patternStr);
	var result = "";
	if(messages){
		for (var i = 0, len = messages.length; i < len; i++) {
			var _tmp = pattern.exec(messages[i].message);
			if(_tmp && _tmp[1]) {
				logger.debug("found match..:"+_tmp[1]);
				result = _tmp[1];
				break;
			}
		}
	}
	return result;
}

var getSubInfo = function(message, patternStr, index) {
	var pattern = new RegExp(patternStr);
	var result = "";
	if(message){
		var _tmp = pattern.exec(message);
		if(_tmp && _tmp[index]) {
			logger.debug("found match..:"+_tmp[index]);
			result = _tmp[index];
		}
	}
	return result;
}

var hmac = function(key, str, encoding) {
    return crypto.createHmac('sha256', key).update(str, 'utf8').digest(encoding);
}

var hash = function(str, encoding) {
    return crypto.createHash('sha256').update(str, 'utf8').digest(encoding);
}


module.exports = () => {
    return {
        extractJson: extractJson,
        isNumeric: isNumeric,
        isValidJson: isValidJson,
        getInfo: getInfo,
		getSubInfo: getSubInfo,
		hmac: hmac,
        hash: hash
    };
};
