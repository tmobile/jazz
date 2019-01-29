const ApiApp = require('./ApiApp');
const FunctionApp = require('./FunctionApp');

module.exports = class CommandMapping {    
    constructor(){
        this.classList = new Map();
        this.classList.set('ApiApp', ApiApp);
        this.classList.set('FunctionApp', FunctionApp);
    }

    async process(payload){
        this.instantiate(payload);
        return this.execute(payload);
    }

    async instantiate(payload){
        if(this.classList.has(payload.className)){
        this.instance = new (this.classList.get(payload.className))(payload.data);
        }
        else{
            var error = new Error(`Classname ${payload.className} is not found.`);
            throw error;
        }
    }

    async execute(payload){
        console.log("this is the payload: " + JSON.stringify(payload));
        console.log(payload.command);
        return await this.instance[payload.command](payload.data);
    }
}
