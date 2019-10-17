const WebSiteManagementClient = require('@azure/arm-appservice').WebSiteManagementClient;
const ResourceManagementClient = require('@azure/arm-resources').ResourceManagementClient;
const StorageManagementClient = require('@azure/arm-storage').StorageManagementClient;
const ApiManagementClient = require("@azure/arm-apimanagement").ApiManagementClient;
const CdnManagementClient = require("@azure/arm-cdn").CdnManagementClient;
const msRestNodeAuth = require("@azure/ms-rest-nodeauth");
const CosmosDBManagementClient = require('@azure/arm-cosmosdb').CosmosDBManagementClient;
const EventHubManagementClient = require('@azure/arm-eventhub').EventHubManagementClient;
const ServiceBusManagementClient = require('@azure/arm-servicebus').ServiceBusManagementClient;

module.exports = class ClientFactory {

    constructor(clientId, clientSecret, tenantId, subscriptionId) {

        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
        this.subscriptionId = subscriptionId;

        this.classList = new Map();
        this.classList.set('WebSiteManagementClient', WebSiteManagementClient);
        this.classList.set('ResourceManagementClient', ResourceManagementClient);
        this.classList.set('StorageManagementClient', StorageManagementClient);
        this.classList.set('ApiManagementClient', ApiManagementClient);
        this.classList.set('CdnManagementClient', CdnManagementClient);
        this.classList.set('CosmosDBManagementClient', CosmosDBManagementClient);
        this.classList.set('EventHubManagementClient', EventHubManagementClient);
        this.classList.set('ServiceBusManagementClient', ServiceBusManagementClient);

        this.instanceList = new Map();
    }

    async init(){
     await this.login();
    }

    async login() {
    	try {
    		const authResponse = await msRestNodeAuth.loginWithServicePrincipalSecretWithAuthResponse(this.clientId, this.clientSecret, this.tenantId);
        	this.credentials = authResponse.credentials
  		} catch (err) {
    		console.log(err);
  		}
    }


    async instantiate(className){
        let resource;
        let localCredentials = this.credentials;
        let localSubscriptionId = this.subscriptionId;
        if(this.classList.has(className)){
            resource = new (this.classList.get(className))(localCredentials, localSubscriptionId);

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
