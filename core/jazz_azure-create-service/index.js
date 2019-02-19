const configModule = require("./components/config.js");
const logger = require("./components/logger.js");
const responseObj = require("./components/response.js");
const errorHandlerModule = require("./components/error-handler.js");
const CommandMapping = require("./components/CommandMapping.js"); 


module.exports = async () => {
    const args = process.argv.slice(2);
    var cmd = args[0];

    let result;
    try {
        const fs = require("fs");
        let text = fs.readFileSync(cmd);
        var obj = JSON.parse(text);
        let commandMapping = new CommandMapping();
        result = await commandMapping.process(obj);
        } 
        catch (error) {
            console.log(responseObj({
                error : error
            }));
         }
        console.log(responseObj({
            result : result
        }));
}
    
        




