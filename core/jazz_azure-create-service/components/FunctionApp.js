const ResourceFactory = require('./ResourceFactory');
const logger = require("./logger.js");
const validator = require('./function/dataValidator');

module.exports = class FunctionApp {
    constructor(data){
        this.data = data;
        this.subscriptionId = data.subscriptionId;
        this.tenantId = data.tenantId;
        this.clientId = data.clientId;
        this.clientSecret = data.clientSecret;

    }

    async init(){
        validator.mustHave(this.data);
        this.resourceFactory = new ResourceFactory(this.data.clientId, this.data.clientSecret, this.data.tenantId, this.data.subscriptionId, this.data.resourceGroupName);
        await this.resourceFactory.init();
    }

    async deleteByTag() {
        await this.init().then(async () => {
            await this.resourceFactory.deleteResourcesByTag(this.data.tagName);
        });
    }

  async createStorage() {
    await this.init();
    return await this.resourceFactory.createStorageAccount(this.data.appName, this.data.tags, this.data.location);
  }

  async createEventResource() {
    await this.init();
    return await this.resourceFactory.createDependency(this.data);
  }

  async createfunction(){
    await this.init();
    return await this.resourceFactory.createFunctionWithConnectionString(this.data);
  }

  async deployFunction(){
    await this.init();
    validator.notNull(this.data.zip, 'zip');
    return await this.resourceFactory.uploadZipToKudu(this.data.stackName, this.data.zip);
  }

  async installFunctionExtensions(){
    await this.init();
    await this.resourceFactory.installFunctionExtensions(this.data.stackName);
    await this.resourceFactory.restartWebApp(this.data.stackName);
  }

  async createDatabase(){
    await this.init();
    await this.resourceFactory.createDatabase(this.data);
  }

  async getMasterKey(){
    await this.init();
    let masterKey = await this.resourceFactory.getMasterKey(this.data.stackName);
    let output = {
      key: masterKey.value
    };
    return output

  }

}
