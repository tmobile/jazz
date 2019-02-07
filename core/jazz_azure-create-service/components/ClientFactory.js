const WebAppManagementClient = require('azure-arm-website');
const ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
const StorageManagementClient = require('azure-arm-storage');
const ApiManagementClient = require("azure-arm-apimanagement");
const CdnManagementClient = require("azure-arm-cdn");
const msRestAzure = require('ms-rest-azure');
const WebApp = require('./WebApp');
// const AzureStorageClient = require('azure-storage');


module.exports = class ClientFactory {

    constructor(clientId, clientSecret, tenantId, subscriptionId) {

        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
        this.subscriptionId = subscriptionId;

        this.classList = new Map();
        this.classList.set('WebAppManagementClient', WebAppManagementClient);
        this.classList.set('ResourceManagementClient', ResourceManagementClient);
        this.classList.set('StorageManagementClient', StorageManagementClient);
        this.classList.set('ApiManagementClient', ApiManagementClient);
        this.classList.set('CdnManagementClient', CdnManagementClient);
        // this.classList.set('AzureStorageClient', AzureStorageClient);


        this.instanceList = new Map();
    }

    async init(){
     await this.login();
    }

    async login(){
        this.credentials = await msRestAzure.loginWithServicePrincipalSecret(this.clientId, this.clientSecret, this.tenantId);
    }


    async instantiate(className){
        let resource;
        if(this.classList.has(className)){
            resource = new (this.classList.get(className))(this.credentials, this.subscriptionId);

        }
        else{
            let error = new Error(`Classname ${className} is not found.`);
            throw error;
        }
        return resource;
    }

    async getResource(resourceName){
      let resource = await this.getResourceByNameOrCreateIfNotExist(resourceName);
      return resource;
    }

    async getResourceByNameOrCreateIfNotExist(resourceName){
        let resource;
        if(this.instanceList.has(resourceName)){
            resource = this.instanceList.get(resourceName);
        }
        else{
            resource = await  this.instantiate(resourceName);
            this.instanceList.set(resourceName, resource);
        }
        return resource;
    }
}
