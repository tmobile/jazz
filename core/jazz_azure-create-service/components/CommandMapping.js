const ApiApp = require('./ApiApp');
const FunctionApp = require('./FunctionApp');
const WebApp = require('./WebApp');

module.exports = class CommandMapping {    
    constructor(){
        this.classList = new Map();
        this.classList.set('ApiApp', ApiApp);
        this.classList.set('FunctionApp', FunctionApp);
        this.classList.set('WebApp', WebApp);
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
            let error = new Error(`Classname ${payload.className} is not found.`);
            throw error;
        }
    }

    async execute(payload){
        return await this.instance[payload.command]();
    }
}
