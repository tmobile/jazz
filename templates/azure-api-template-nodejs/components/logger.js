module.exports = function() {
    var logLevels = {
        error: 3,
        warn: 2,
        info: 1,
        debug: 0
    };

    var config = {
        curLogLevel: 'info'
    };

    var init = function() {
        // Get LOG_LEVEL from the environment variables (if defined)
        try {
            level = process.env.LOG_LEVEL;
        } catch (e) {
            // error trying to access LOG_LEVEL environment variable
            // Do nothing!
        }
        if (level) {
            config.curLogLevel = level;
        }
    };

    var log = function(level, message) {
        if (logLevels[level] >= logLevels[config.curLogLevel]) {
            if (level === 'error') {
                console.error(message);
            } else if (level === 'warn') {
                console.warn(message);
            } else if (level === 'info') {
                console.info(message);
            } else if (level === 'debug') {
                console.debug(message);
            } else {
                console.log(message);
            }
        }
        return;
    };

    var error = function(message) {
        log('error', message);
    };
    var warn = function(message) {
        log('warn', message);
    };
    var info = function(message) {
        log('info', message);
    };
    var debug = function(message) {
        log('debug', message);
    };

    return {
        init: init,
        log: log,
        error: error,
        warn: warn,
        info: info,
        debug: debug
    };
}();
