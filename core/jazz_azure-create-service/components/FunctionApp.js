const ResourceFactory = require('./ResourceFactory');
const msRestAzure = require('ms-rest-azure');
module.exports = class FunctionApp {    
    constructor(data){
        this.subscriptionId = data.subscriptionId;
        this.tenantId = data.tenantId;
        this.clientId = data.clientId;
        this.clientSecret = data.clientSecret;
    }

    async login(){
        this.credentials = await msRestAzure.loginWithServicePrincipalSecret(this.clientId, this.clientSecret, this.tenantId);
    }

    async create(data){
        console.log(data);
        await this.login();
        console.log(await ResourceFactory.createStorageAccount(data.resourceGroupName, data.appName, this.subscriptionId, this.credentials));
        console.log(await ResourceFactory.createHostingPlan(data.resourceGroupName, this.subscriptionId, this.credentials));
        console.log(await ResourceFactory.createFunctionApp(data.resourceGroupName, data.appName, this.subscriptionId, this.credentials));
    }
}