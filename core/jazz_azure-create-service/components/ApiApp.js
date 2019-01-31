const ResourceFactory = require('./ResourceFactory');
const msRestAzure = require('ms-rest-azure');

module.exports = class ApiApp {    
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
        await this.login();
        try {
            await ResourceFactory.createStorageAccount(data.resourceGroupName, data.appName, this.subscriptionId, this.credentials);
            await ResourceFactory.createHostingPlan(data.resourceGroupName, this.subscriptionId, this.credentials);
            await ResourceFactory.createFunctionApp(data.resourceGroupName, data.appName, this.subscriptionId, this.credentials);
            await ResourceFactory.upload(data.resourceGroupName, data.appName, data.zip, this.subscriptionId, this.credentials);
            await ResourceFactory.createOrUpdateApiGatewayWithSwaggerJson("oscar-jazz", data.serviceName, data.apiId, this.credentials, this.subscriptionId, data.swagger, data.basepath);
            await ResourceFactory.addApiToProduct(data.resourceGroupName, data.serviceName, "starter", data.apiId, this.credentials, this.subscriptionId);
        }catch (e) {
            //TODO:decide how to delete this properly, probs some sort of stack or a tag

        }
    }

    async deleteByTag(data){
        await this.login();
        await ResourceFactory.deleteResourcesByTag(data.tagName, this.subscriptionId, this.credentials);
    }
}
