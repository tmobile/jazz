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

  async createStorage(){
    await this.init().then(async () => {
      try {
        await this.resourceFactory.createStorageAccount(this.data.appName, this.data.tags, this.data.location);
      }catch (exception) {
        logger.error(exception);
        throw exception;
      }
    });
    return this.resourceFactory.resourceStack;
  }

  async createEventResource(){
    await this.init().then(async () => {
      try {
       await this.resourceFactory.createDependency(this.data);

      }catch (exception) {
        logger.error(exception);
        throw exception;
      }
    });
    logger.debug('done');
    return this.resourceFactory.resourceStack;
  }

  async createfunction(){
    await this.init().then(async () => {
      try {
        await this.resourceFactory.createFunctionWithConnectionString(this.data);
      }catch (exception) {
        logger.error(exception);
        throw exception;
      }
    });
    return this.resourceFactory.resourceStack;
  }


  async deployFunction(){
    await this.init().then(async () => {
      try {
        validator.notNull(data.zip, 'zip');
        await this.resourceFactory.uploadZipToKudu(this.data.stackName, this.data.zip);

      }catch (exception) {
        logger.error(exception);
        throw exception;
      }
    });
    return this.resourceFactory.resourceStack;
  }

  async installFunctionExtensions(){
    await this.init().then(async () => {
      try {
        logger.debug('installing extension');
        await this.resourceFactory.installFunctionExtensions(this.data.stackName);
      }catch (exception) {
        logger.error(exception);
        throw exception;
      }
    });
    return this.resourceFactory.resourceStack;
  }

  async createDatabase(){
    await this.init().then(async () => {
      try {
        await this.resourceFactory.createDatabase(this.data);
      }catch (exception) {
        logger.error(exception);
        throw exception;
      }
    });
    return;
  }

}
