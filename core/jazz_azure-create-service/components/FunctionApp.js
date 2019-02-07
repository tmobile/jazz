const ResourceFactory = require('./ResourceFactory');

module.exports = class FunctionApp {
    constructor(data){
        this.data = data;
        this.subscriptionId = data.subscriptionId;
        this.tenantId = data.tenantId;
        this.clientId = data.clientId;
        this.clientSecret = data.clientSecret;
    }

    async init(){
        this.resourceFactory = new ResourceFactory(this.data.clientId, this.data.clientSecret, this.data.tenantId, this.data.subscriptionId, this.data.resourceGroupName);
        await this.resourceCreator.init();
    }

    async deleteByTag() {
        await this.init().then(async () => {
            await this.resourceFactory.deleteResourcesByTag(this.data.tagName);
        });
    }

    async create(){
        await this.init().then(async () => {
            try {
                let storageAccount = await this.resourceFactory.createStorageAccount(this.data.appName, this.data.tags);
                let storageAccountKeys = await this.resourceFactory.listStorageAccountKeys(storageAccount.name);
                let storageAccountKey = storageAccountKeys.keys[0].value;
                await this.resourceFactory.createHostingPlan();
                await this.resourceFactory.createFunctionApp(this.data.appName, storageAccountKey, this.data.tags);
                await this.resourceFactory.uploadZipToKudu(this.data.appName, this.data.zip);
            }catch (exception) {
                await this.resourceFactory.rollBack();
                throw exception;
            }
        });
        return this.resourceFactory.resourceStack;
    }
}
