const WebAppManagementClient = require('azure-arm-website');
const resourceManagement = require('azure-arm-resource');
const StorageManagementClient = require('azure-arm-storage');
const ApiManagementClient = require("azure-arm-apimanagement");
const utils = require('./Utils');
/**
 * 
 * 
*/
module.exports = {
    createResourceGroup,
    createHostingPlan,
    createWebApp,
    createFunctionApp,
    createStorageAccount,
    listResourcesByTag,
    deleteResourcesByTag,
    deleteResourcesById,
    getLatestApiVersionForResource,
    createOrUpdateApiGatewayWithSwaggerJson,
    deleteApi,
    upload
}

async function createResourceGroup(resourceGroupName, subscriptionId, credentials, location = 'westus', tags = {} ) {          

    var client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
    var groupParameters = {
         location: location,
          tags: tags
         };
    var result = await client.resourceGroups.createOrUpdate(resourceGroupName, groupParameters);
    return result;
} 

async function createHostingPlan(resourceGroupName, subscriptionId, credentials, location = 'westus', tags = {}, planSkuName = 'Y1', planName = 'WestUSPlan' ) {
  //https://azure.microsoft.com/en-us/pricing/details/app-service/windows/
    var info = {
      location: location,
      tags: tags, 
      sku: {
        name: planSkuName,
        capacity: 0
        }
    };
    var webAppManagementClient = new WebAppManagementClient(credentials, subscriptionId);
    return webAppManagementClient.appServicePlans.createOrUpdate(resourceGroupName, planName, info);
}

async function createStorageAccount(resourceGroupName, storageName, subscriptionId, credentials, tags = {}, skuName = 'Standard_LRS') {
    var options = {
      tags: tags,
      sku: {
        name: skuName
      },
      kind: "StorageV2",
      location: "westus",
      accessTier: "Hot"
      };
    var storageManagementClient = new StorageManagementClient(credentials, subscriptionId);
    var name = storageName.toLowerCase() + await utils.randomID();
    var nameAvailable = false;
    var attemptCounter = 0;
    while(attemptCounter < 20 && !nameAvailable){
      attemptCounter++;
      nameAvailable = await storageManagementClient.storageAccounts.checkNameAvailability(name, null);
      console.log("name is available...continuing");
    }
    if(nameAvailable){
      return storageManagementClient.storageAccounts.create(resourceGroupName, name, options);
    }
    else{
      console.log("After trying 20 different names, no names were available");
      var err = new Error('Name Unavailable');
      throw err;
    }
    
}

async function createWebApp(resourceGroupName, appName, envelope, subscriptionId, credentials) {
    let webAppManagementClient = new WebAppManagementClient(credentials, subscriptionId);
    return webAppManagementClient.webApps.createOrUpdate(resourceGroupName, appName, envelope);
}

async function createFunctionApp(resourceGroupName, appName , subscriptionId, credentials, tags = { owner: "test",
                                                                                                    environment: "test",
                                                                                                    application: "test",
                                                                                                    STAGE: "test",
                                                                                                    service: "test",
                                                                                                    domain: "test"
                                                                                                }) {
    var envelope = {
        tags: tags,
        location: "westus",
        kind: 'functionApp',
        serverFarmId: "WestUSPlan",
        properties: {
        }
      };
    return await createWebApp(resourceGroupName, appName, envelope, subscriptionId, credentials);
}

async function listResourcesByTag(tagName,subscriptionId, credentials){
  const client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
  var resourcesByTags = await client.resources.list({filter: `tagName eq '${tagName}'`});
  return resourcesByTags;
}

async function deleteResourcesByTag(tagName,subscriptionId, credentials){
  var resources = await listResourcesByTag(tagName, subscriptionId, credentials );
  console.log(resources);
  resources.forEach(async function(resource){
    var apiVersion = await getLatestApiVersionForResource(resource, subscriptionId, credentials);
    deleteResourcesById(resource,apiVersion, subscriptionId, credentials);
  });
}

async function deleteResourcesById(resource, apiVersion, subscriptionId, credentials){
  var client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
  console.log("trying to delete" + resource.id);
  var result = await client.resources.deleteById(resource.id, apiVersion);
  console.log(result);
}

async function getLatestApiVersionForResource(resource,subscriptionId, credentials){
  var client = new resourceManagement.ResourceManagementClient(credentials, subscriptionId);
  var providerNamespace = resource.type.split('/')[0];
  var providerType = resource.type.split('/')[1];
  var response = await client.providers.get(providerNamespace);
  var apiVersion;
  var string = JSON.stringify(response);
  response['resourceTypes'].forEach(function(resource){
    if(resource.resourceType === providerType){
      apiVersion = resource.apiVersions[0];
      console.log("apiVersion" + apiVersion);
    }
  });
  return apiVersion;
}

async function createOrUpdateApiGatewayWithSwaggerJson(resourceGroupName, serviceName, apiId, credentials, subscriptionId, swaggerString, basepath) {
  var parameters = {
        "contentFormat": "swagger-json",
        "contentValue": JSON.stringify(swaggerString),
        "path": basepath
      };   
 const client = new ApiManagementClient(credentials, subscriptionId);
 var result = await client.api.createOrUpdateWithHttpOperationResponse(resourceGroupName, serviceName, apiId, parameters, null);
 return result;
}

async function deleteApi(resourceGroupName, serviceName, apiId, credentials, subscriptionId) {
    const client = new ApiManagementClient(credentials, subscriptionId);
    var result = await client.api.deleteMethodWithHttpOperationResponse(resourceGroupName, serviceName, apiId, "*", null);
    return result;
 }

 async function upload(resourceGroup, appName, subscriptionId, b64string, credentials) {
    var buffer = Buffer.from(b64string, 'base64');
    var stream = new Stream.PassThrough();
    stream.end(buffer);
    
    const client = await new webSiteManagementClient(credentials, subscriptionId, null, null);
    var pubcreds = await client.webApps.listPublishingCredentials(resourceGroup, appName, null);
       
        console.log("Trying to upload a file");
        var config = {
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
           
       return await axios.put(
            `https://${appName}.azurewebsites.net/api/zipdeploy`,
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
 

