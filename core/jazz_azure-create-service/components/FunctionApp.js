const ResourceFactory = require('./ResourceFactory');
const logger = require("./logger.js");
const fs = require('fs');
const path = require('path');
const validator = require('./function/dataValidator');

module.exports = class FunctionApp {
    constructor(data){
        this.data = data;
        this.subscriptionId = data.subscriptionId;
        this.tenantId = data.tenantId;
        this.clientId = data.clientId;
        this.clientSecret = data.clientSecret;



      // let filePath = path.join(__dirname, 'after.txt');
      // data.zip = fs.readFileSync(filePath, 'utf8');
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

    async create(){
        await this.init().then(async () => {
            try {
              logger.debug("function app starting...");

                await this.resourceFactory.createStorageAccount(this.data.appName, this.data.tags, this.data.location);
                // await this.resourceFactory.createHostingPlan();
                await this.resourceFactory.createFunctionAppWithDependency(this.data);
                await this.resourceFactory.uploadZipToKudu(this.data.stackName, this.data.zip);
                if (this.data.eventSourceType) {
                  logger.debug("installing extension");
                  await this.resourceFactory.installFunctionExtensions(this.data.stackName);
                }

            }catch (exception) {
              logger.error("oh oh error occur....");
                logger.error(exception);
                // await this.resourceFactory.rollBack();
                throw exception;
            }
        });
        return this.resourceFactory.resourceStack;
    }
}
