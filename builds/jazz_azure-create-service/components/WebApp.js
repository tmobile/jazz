const ResourceFactory = require('./ResourceFactory');

module.exports = class WebApp {
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
                await this.resourceFactory.setBlobServicePropertiesForWebsite(storageAccountKey);
                await this.resourceFactory.uploadFilesToStorageFromZipBase64(storageAccountKey, this.data.zip);
                await this.resourceFactory.createCdnProfile(this.data.tags);
                await this.resourceFactory.createCdnEndpoint(storageAccount.primaryEndpoints.web, this.data.tags);
                }catch (exception) {
                    await this.resourceFactory.rollBack();
                    throw exception;
                }
        });
       return this.resourceFactory.resourceStack;
    }


    async deleteByTag() {
        await this.init().then(async () => {
            await this.resourceFactory.deleteResourcesByTag(this.data.tagName);
        });
    }
}
