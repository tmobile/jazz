const ResourceFactory = require('./ResourceFactory');

module.exports = class ApiApp {
    constructor(data){
        this.data = data;
    }

    async init(){
        this.resourceFactory = new ResourceFactory(this.data.clientId, this.data.clientSecret, this.data.tenantId, this.data.subscriptionId, this.data.resourceGroupName);
        await this.resourceFactory.init();
    }

    async create(){
       await this.init().then(async () => {
            try {
                let storageAccount = await this.resourceFactory.createStorageAccount(this.data.storageName, this.data.tags);
                let storageAccountKeys = await this.resourceFactory.listStorageAccountKeys(storageAccount.name);
                let storageAccountKey = storageAccountKeys.keys[0].value;
                await this.resourceFactory.createHostingPlan(this.data.resourceGroupName, 'westus', {}, 'Y1', this.data.appName);
                await this.resourceFactory.createFunctionApp(this.data.appName, storageAccountKey, this.data.tags, undefined,undefined,undefined,undefined, this.data.runtime);
                await this.resourceFactory.uploadZipToKudu(this.data.appName, this.data.zip);
                await this.resourceFactory.createOrUpdateApiGatewayWithSwaggerJson(this.data.serviceName, this.data.apiId, this.data.swagger, this.data.appName, this.data.basepath);
                await this.resourceFactory.createOrUpdateApiContract(this.data.serviceName,this.data.apiId);
                await this.resourceFactory.setSubscriptionForProduct(this.data.serviceName, "starter");
                await this.resourceFactory.addApiToProduct(this.data.serviceName, "starter", this.data.apiId);

            }catch (exception) {
                console.log(exception);
                await this.resourceFactory.rollBack();
                throw exception;
            }
        });
        return this.resourceFactory.resourceStack;
    }


    async deleteByTag(){
        await this.init().then(async () => {
            await this.resourceFactory.deleteResourcesByTag(this.data.tagName);
        });
    }
}

