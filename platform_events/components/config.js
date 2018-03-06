
var getStageConfig = (event) => {
    var stage = event.stage;
    var configObj = {};
    configObj = require('../config/' + stage + '-config.json')
    
    return configObj;
};

module.exports = (event) => {
    var config = getStageConfig(event);
    return config;
};
