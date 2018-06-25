var SlackChannelInfoErrorHandler = function(error) {
    return {
        name: "SlackChannelInfoError",
        error: error
    };
}


var SlackChannelNotificationErrorHandler = function(error) {
    return {
        name: "SlackChannelNotificationError",
        error: error
    };
}

var ServiceGetErrorHandler = function(error) {
    return {
        name: "ServiceGetError",
        error: error
    };
}




module.exports = () => {
    return {
        SlackChannelInfoErrorHandler: SlackChannelInfoErrorHandler,
        SlackChannelNotificationErrorHandler: SlackChannelNotificationErrorHandler,
        ServiceGetErrorHandler: ServiceGetErrorHandler
    };
};