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

    async create(data) {
      try {
        await this.login();
        let resourceFactory = new ResourceFactory();
        let storageAccount = await resourceFactory.createStorageAccount(data.resourceGroupName, data.appName, this.subscriptionId, this.credentials);
        let storageAccountKeys = await resourceFactory.listStorageAccountKeys(data.resourceGroupName, storageAccount.name, this.subscriptionId, this.credentials);
        await resourceFactory.createHostingPlan(data.resourceGroupName, this.subscriptionId, this.credentials);
        await resourceFactory.createFunctionApp(data.resourceGroupName, data.appName, this.subscriptionId, this.credentials, storageAccount.name, storageAccountKeys.keys[0].value);
        await resourceFactory.upload(data.resourceGroupName, data.appName, data.zip, this.subscriptionId, this.credentials);
        await resourceFactory.createOrUpdateApiGatewayWithSwaggerJson(data.resourceGroupName, data.serviceName, data.apiId, this.credentials, this.subscriptionId, data.swagger, data.basepath);
        await resourceFactory.addApiToProduct(data.resourceGroupName, data.serviceName, "starter", data.apiId, this.credentials, this.subscriptionId);
    }

    async deleteByTag(data){
        await this.login();
        await ResourceFactory.deleteResourcesByTag(data.tagName, this.subscriptionId, this.credentials);
    }
}
