const WebAppManagementClient = require('azure-arm-website');
const resourceManagement = require('azure-arm-resource');
const StorageManagementClient = require('azure-arm-storage');
const ApiManagementClient = require("azure-arm-apimanagement");
const msRestAzure = require('ms-rest-azure');
const Stream = require('stream');
const utils = require('./Utils');
// const request = require('request');
const axios = require('axios');

/**
 *
 *
 */
module.exports = class ResourceFactory {


    async createResourceGroup(resourceGroupName, subscriptionId, credentials, location = 'westus', tags = {}) {

        let client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
        let groupParameters = {
            location: location,
            tags: tags
        };
        let result = await client.resourceGroups.createOrUpdate(resourceGroupName, groupParameters);
        return result;
    }

    async createHostingPlan(resourceGroupName, subscriptionId, credentials, location = 'westus', tags = {}, planSkuName = 'Y1', planName = 'WestUSPlan') {
        //https://azure.microsoft.com/en-us/pricing/details/app-service/windows/
        let info = {
            location: location,
            tags: tags,
            sku: {
                name: planSkuName,
                capacity: 0
            }
        };
        let webAppManagementClient = new WebAppManagementClient(credentials, subscriptionId);
        return webAppManagementClient.appServicePlans.createOrUpdate(resourceGroupName, planName, info);
    }


    async createStorageAccount(resourceGroupName, storageName, subscriptionId, credentials, tags = {}, skuName = 'Standard_LRS') {
        let options = {
            tags: tags,
            sku: {
                name: skuName
            },
            kind: "StorageV2",
            location: "westus",
            accessTier: "Hot"
        };
        let storageManagementClient = new StorageManagementClient(credentials, subscriptionId);
        let name;
        let nameAvailable = false;
        let attemptCounter = 0;
        while (attemptCounter < 20 && !nameAvailable) {
            name = storageName.toLowerCase() + await utils.randomID();
            attemptCounter++;
            nameAvailable = await storageManagementClient.storageAccounts.checkNameAvailability(name, null);

        }
        if (nameAvailable) {
            this.storageAccountName = name;
            console.log("name is available...continuing");
            return storageManagementClient.storageAccounts.create(resourceGroupName, name, options);
        } else {
            console.log("After trying 20 different names, no names were available");
            let err = new Error('Name Unavailable');
            throw err;
        }

    }

    async listStorageAccountKeys(resourceGroupName, storageName, subscriptionId, credentials) {

        let storageManagementClient = new StorageManagementClient(credentials, subscriptionId);
        return await storageManagementClient.storageAccounts.listKeys(resourceGroupName, storageName, null);

    }

    async createWebApp(resourceGroupName, appName, envelope, subscriptionId, credentials) {
        let webAppManagementClient = new WebAppManagementClient(credentials, subscriptionId);
        return webAppManagementClient.webApps.createOrUpdateWithHttpOperationResponse(resourceGroupName, appName, envelope);
    }

    async createFunctionApp(resourceGroupName, appName, subscriptionId, credentials, storageAccountName, storageAccountKey, tags = {
        owner: "test",
        environment: "test",
        application: "test",
        STAGE: "test",
        service: "test",
        domain: "test"
    }) {


        let envelope = {
            tags: tags,
            location: "westus",
            kind: 'functionApp',
            serverFarmId: "WestUSPlan",
            properties: {},
            siteConfig: {

                appSettings: [

                    {
                        "name": "FUNCTIONS_WORKER_RUNTIME",
                        "value": "node"
                    },

                    {
                        "name": "FUNCTIONS_EXTENSION_VERSION",
                        "value": "~2"
                    },

                    {
                        "name": "WEBSITE_NODE_DEFAULT_VERSION",
                        "value": "8.11.1"
                    },

                    {
                        "name": "AzureWebJobsStorage",
                        "value": `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccountKey}`
                    },

                    {
                        "name": "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING",
                        "value": `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageAccountKey}`
                    },
                    {
                        "name": "WEBSITE_CONTENTSHARE",
                        "value": storageAccountName
                    },

                ]

            }

        }
        return await this.createWebApp(resourceGroupName, appName, envelope, subscriptionId, credentials);
    }


    async listResourcesByTag(tagName, subscriptionId, credentials) {
        const client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
        let resourcesByTags = await client.resources.list({filter: `tagName eq '${tagName}'`});
        return resourcesByTags;
    }

    async deleteResourcesByTag(tagName, subscriptionId, credentials) {
        let resources = await listResourcesByTag(tagName, subscriptionId, credentials);
        console.log(resources);
        resources.forEach(async function (resource) {
            let apiVersion = await this.getLatestApiVersionForResource(resource, subscriptionId, credentials);
            this.deleteResourcesById(resource, apiVersion, subscriptionId, credentials);
        });
    }

    async deleteResourcesById(resource, apiVersion, subscriptionId, credentials) {
        let client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
        console.log("trying to delete" + resource.id);
        let result = await client.resources.deleteById(resource.id, apiVersion);
        console.log(result);
    }

    async getLatestApiVersionForResource(resource, subscriptionId, credentials) {
        let client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
        let providerNamespace = resource.type.split('/')[0];
        let providerType = resource.type.split('/')[1];
        let response = await client.providers.get(providerNamespace);
        let apiVersion;
        let string = JSON.stringify(response);
        response['resourceTypes'].forEach(function (resource) {
            if (resource.resourceType === providerType) {
                apiVersion = resource.apiVersions[0];
                console.log("apiVersion" + apiVersion);
            }
        });
        return apiVersion;
    }

    async createOrUpdateApiGatewayWithSwaggerJson(resourceGroupName, serviceName, apiId, credentials, subscriptionId, swagger, basepath) {
        console.log(JSON.stringify(swagger));
        let parameters = {
            "contentFormat": "swagger-json",
            "contentValue": JSON.stringify(swagger),
            "path": basepath
        }

        console.log("parameters here: " + JSON.stringify(parameters));
        const client = new ApiManagementClient(credentials, subscriptionId);
        let result = await client.api.createOrUpdateWithHttpOperationResponse(resourceGroupName, serviceName, apiId, parameters, null);
        return result;
    }

    async deleteApi(resourceGroupName, serviceName, apiId, credentials, subscriptionId) {
        const client = new ApiManagementClient(credentials, subscriptionId);
        let result = await client.api.deleteMethodWithHttpOperationResponse(resourceGroupName, serviceName, apiId, "*", null);
        return result;
    }

    async addApiToProduct(resourceGroupName, serviceName, productId, apiId, credentials, subscriptionId) {
        const client = new ApiManagementClient(credentials, subscriptionId);
        let result = await client.productApi.createOrUpdate(resourceGroupName, serviceName, productId, apiId, null);
        return result;
    }

    async upload(resourceGroup, appName, b64string, subscriptionId, credentials) {
        let buffer = Buffer.from(b64string, 'base64');
        let stream = new Stream.PassThrough();
        stream.end(buffer);

        const client = await new WebAppManagementClient(credentials, subscriptionId, null, null);
        let pubcreds = await client.webApps.listPublishingCredentials(resourceGroup, appName, null);
        console.log(pubcreds);
        console.log("Trying to upload a file");
        let config = {
            headers: {
                Accept: '*/*'
            },
            auth: {
                username: pubcreds.publishingUserName,
                password: pubcreds.publishingPassword
            },
            encoding: null,
            body: stream
        };

        //   request({
        //             url: `https://${appName}.scm.azurewebsites.net/api/zipdeploy`,
        //             method: 'PUT',
        //             body: stream,
        //             encoding: null,
        //             auth: {
        //                 username: pubcreds.publishingUserName,
        //                 password: pubcreds.publishingPassword
        //               },
        //               headers: {
        //                 Accept: '*/*'
        //               }
        //           }, (error, response) => {
        //             if (error) {
        //                 console.log(error);
        //                 throw error;
        //             } else {
        //                 console.log(response);
        //               return response;
        //             }
        //           })

        return await axios.put(
            `https://${appName}.scm.azurewebsites.net/api/zipdeploy`,
            stream,
            config
        ).then((response) => {
            console.log(response.status);
            console.log(response.statusText);
            console.log(response.data);
        }).catch((error) => {
            console.log(error.response.status);
            console.log(error.response.statusText);
            console.log(error.response.data);
            console.log(error.response.data.error);
        });
    }
}
