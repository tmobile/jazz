const index = require("../index.js");


module.exports = async function (context, myEvent) {
    context.log('JavaScript trigger function processed a request.', myEvent);
    index.handler(myEvent, context, (error, responseData) => {

        if (error) {
            context.log('you got error ', error);
        } else {
            context.log('you are success ', responseData);

        }

    })

};
