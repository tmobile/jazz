const ResourceFactory = require('./ResourceFactory');
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
    await this.init();
    let message =  await this.resourceFactory.deleteResourcesByServiceName(this.data.tagName, this.data.tagValue);
    let output = {
      message: message
    };
    return output;
  }

  async createStorage() {
    await this.init();
    await this.resourceFactory.createStorageAccountOnlyIfNotExists(this.data.appName, this.data.tags, this.data.location);

  }

  async createEventResource() {
    await this.init();
    await this.resourceFactory.createDependency(this.data);
  }

  async createfunction(){
    await this.init();
    await this.resourceFactory.createFunctionWithConnectionString(this.data);
  }

  async deployFunction(){
    await this.init();
    validator.notNull(this.data.zip, 'zip');
    await this.resourceFactory.uploadZipToKudu(this.data.stackName, this.data.zip);
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
    return output;

  }

  async getResourcesByServiceName() {
    await this.init();
    return await this.resourceFactory.getResourcesByServiceName(this.data.tagName, this.data.tagValue);
  }
}
