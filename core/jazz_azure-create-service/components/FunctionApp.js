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
      await this.init().then(async () => {
          await this.resourceFactory.deleteResourcesByTag(this.data.tagName);
      });
  }

  async createStorage() {
    await this.init();
    let stack = await this.resourceFactory.createStorageAccount(this.data.appName, this.data.tags, this.data.location);
    let output = {
      id: stack.id
    };
    return output;
  }

  async createEventResource() {
    await this.init();
    let stack = await this.resourceFactory.createDependency(this.data);
    let id = '';
    if (stack) {
      id = stack.id;
    }
    let output = {
      id: id
    };
    return output;
  }

  async createfunction(){
    await this.init();
    let stack = await this.resourceFactory.createFunctionWithConnectionString(this.data);
    let output = {
      id: stack.id
    };
    return output;
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
    let stack = await this.resourceFactory.createDatabase(this.data);

    let output = {
      id: stack.id
    };
    return output;

  }

  async getMasterKey(){
    await this.init();
    let masterKey = await this.resourceFactory.getMasterKey(this.data.stackName);
    let output = {
      key: masterKey.value
    };
    return output;

  }

}
