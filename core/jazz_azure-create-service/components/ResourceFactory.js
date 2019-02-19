const storage = require('azure-storage');
const Stream = require('stream');
const request = require('request');
const AdmZip = require('adm-zip');
const mime = require('mime-types');
const url = require('url');
const functionCreateHandler = require('./function/functionCreateHandler');

const ClientFactory = require('./ClientFactory');
const dbHandler = require('./function/cosmosDBHandler');
/**
 *
 *
 */
module.exports = class ResourceFactory {

  constructor(clientId, clientSecret, tenantId, subscriptionId, resourceGroupName){
    this.resourceStack = [];
    this.factory = new ClientFactory(clientId, clientSecret, tenantId, subscriptionId);
    this.resourceGroupName = resourceGroupName;
  }


  async init(){
    await this.factory.init();
  }

  async withStack(object){
    this.resourceStack.push(object);
    return object;
  }

  async rollBack(){
    console.log("initiated rollback");
    for (let i = this.resourceStack.length -1 ; i >= 0; i--) {
      await this.deleteResourcesById(this.resourceStack.pop());
    }
  }

  async createResourceGroup(resourceGroupName = this.resourceGroupName, location = 'westus', tags = {}) {

    let groupParameters = {
      location: location,
      tags: tags
    };

    let client = await this.factory.getResource("ResourceManagementClient");
    let result = await client.resourceGroups.createOrUpdate(resourceGroupName, groupParameters);
    return this.withStack(result);
  }


  async createHostingPlan(resourceGroupName = this.resourceGroupName, location = 'westus', tags = {}, planSkuName = 'Y1', planName = 'WestUSPlan') {
    //https://azure.microsoft.com/en-us/pricing/details/app-service/windows/
    let info = {
      location: location,
      tags: tags,
      sku: {
        name: planSkuName,
        capacity: 0
      }
    };

    let client = await this.factory.getResource("WebAppManagementClient");
    let result = await client.appServicePlans.createOrUpdate(resourceGroupName, planName, info);
    return this.withStack(result);
  }


  async createStorageAccount(storageAccountName, tags = {}, location = 'westus', skuName = 'Standard_LRS', resourceGroupName = this.resourceGroupName) {
    let options = {
      tags: tags,
      sku: {
        name: skuName
      },
      kind: "StorageV2",
      location: location,
      accessTier: "Hot"
    };
    let client = await this.factory.getResource("StorageManagementClient");
    let result = await client.storageAccounts.create(resourceGroupName, storageAccountName, options);
    this.storageAccountName = storageAccountName;
    return this.withStack(result);
  }


  async createBlobContainer(storageName, resourceGroupName = this.resourceGroupName) {
    let client = await this.factory.getResource("StorageManagementClient");
    return await client.blobContainers.create(resourceGroupName, storageName, "$web");
  }


  async setBlobServicePropertiesForWebsite(accountKey, storageName = this.storageAccountName) {
    let serviceProperties = {
      StaticWebsite: {
        Enabled: true,
        IndexDocument: "index.html",
        ErrorDocument404Path: "error/404.html"
      }
    };

    let blobStorage = storage.createBlobService(storageName,accountKey);
    return new Promise(function(resolve, reject) {
      blobStorage.setServiceProperties(serviceProperties, function(err, resp, body) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      })
    });
  }


  async listStorageAccountKeys(storageName = this.storageAccountName, resourceGroupName = this.resourceGroupName) {
    let client = await this.factory.getResource("StorageManagementClient");
    return await client.storageAccounts.listKeys(resourceGroupName, storageName, null);
  }


  async createWebApp(appName, envelope, resourceGroupName = this.resourceGroupName) {
    let client = await this.factory.getResource("WebAppManagementClient");
    let result = await client.webApps.createOrUpdate(resourceGroupName, appName, envelope);
    return this.withStack(result);
  }


  async createFunctionApp( appName, storageAccountKey, tags = {}, storageAccountName = this.storageAccountName, resourceGroupName = this.resourceGroupName, location = 'westus', connectionString = '') {
    let envelope = {
      tags: tags,
      location: location,
      kind: "functionApp",
      properties: {},
      siteConfig: {
        appSettings: [
          {
            "name": "FUNCTIONS_WORKER_RUNTIME",
            "value": "node"
          },
    async createFunctionApp( appName, storageAccountKey, tags = {}, storageAccountName = this.storageAccountName, resourceGroupName = this.resourceGroupName, location = 'westus', connectionString = '', runtime = 'node') {
        let envelope = {
            tags: tags,
            location: location,
            kind: "functionApp",
            properties: {},
            siteConfig: {
                appSettings: [
                    {
                        "name": "FUNCTIONS_WORKER_RUNTIME",
                        "value": runtime
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
          {
            "name": "CONNECTION_STRING",
            "value": connectionString
          }
        ]
      }
    }
    return await this.createWebApp(appName, envelope, resourceGroupName = this.resourceGroupName );
  }


  async listResourcesByTag(tagName) {
    let client = await this.factory.getResource("ResourceManagementClient");
    let resourcesByTags = await client.resources.list({filter: `tagName eq '${tagName}'`});
    return resourcesByTags;
  }


  async deleteResourcesByTag(tagName) {
    let resources = await this.listResourcesByTag(tagName);
    resources.forEach(async function (resource) {
      await this.deleteResourcesById(resource);
    });
  }


  async deleteResourcesById(resource) {
    // console.log("trying to delete resource:  " + resource);
    if (resource.type.toLowerCase() === "Microsoft.ApiManagement/service/apis"){
      // console.log("deleting " + resource.id);
      return await this.deleteApi(resource.id);
    }
    else {
      let client = await this.factory.getResource("ResourceManagementClient");
      // console.log("deleting " + resource.id);
      let apiVersion = await this.getLatestApiVersionForResource(resource);
      return await client.resources.deleteById(resource.id, apiVersion);
    }
  }


  async getLatestApiVersionForResource(resource) {
    let client = await this.factory.getResource("ResourceManagementClient");
    let providerNamespace = resource.type.split('/')[0];
    let providerType = resource.type.split('/')[1];
    let response = await client.providers.get(providerNamespace);
    let apiVersion = undefined;
    await response['resourceTypes'].forEach(async function (resource) {

      if (resource.resourceType.toLowerCase() === providerType.toLowerCase()) {
        apiVersion = resource.apiVersions[0];
      }
    });
    return apiVersion;
  }


  async createOrUpdateApiGatewayWithSwaggerJson(serviceName, apiId, swagger, basePath = "api", resourceGroupName = this.resourceGroupName) {
    const fs = require("fs");
    let text = fs.readFileSync(swagger);
    var obj = JSON.parse(text);

    let parameters = {
      "contentFormat": "swagger-json",
      "contentValue": JSON.stringify(obj),
      "path": basePath
    }
    let client = await this.factory.getResource("ApiManagementClient");
    let result = await client.api.createOrUpdate(resourceGroupName, serviceName, apiId, parameters, null);
    this.serviceName = serviceName;
    return this.withStack(result);
  }


  async deleteApi(apiId, serviceName = this.serviceName, resourceGroupName = this.resourceGroupName) {
    let client = await this.factory.getResource("ApiManagementClient");
    let result = await client.api.deleteMethod(resourceGroupName, serviceName, apiId, "*", null);
    return result;
  }


  async addApiToProduct(serviceName, productId, apiId, resourceGroupName = this.resourceGroupName) {
    let client = await this.factory.getResource("ApiManagementClient");
    let result = await client.productApi.createOrUpdate(resourceGroupName, serviceName, productId, apiId, null);
    return result;
  }


  async createCdnProfile(tags = {}, storageName = this.storageAccountName, resourceGroupName = this.resourceGroupName, location = "West US", skuName = "Standard_Akamai") {
    let standardCreateParameters = {
      location: location,
      tags: tags,
      sku: {
        name: skuName
      }
    };
    let client = await this.factory.getResource("CdnManagementClient");
    return this.withStack(client.profiles.create(resourceGroupName, storageName, standardCreateParameters));
  }


  async createCdnEndpoint(hostname, tags = {},  storageName = this.storageAccountName, resourceGroupName = this.resourceGroupName, location = "West US") {
    let path = url.parse(hostname, true);
    console.log(path.path);
    let endpointProperties = {
      location: location,
      tags: tags,
      origins: [{
        name: 'newname',
        hostName: path.host
      }]
    }

    let client = await this.factory.getResource("CdnManagementClient");
    return this.withStack(client.endpoints.create(resourceGroupName, storageName, storageName, endpointProperties));
  }

  async uploadFilesToStorageFromZipBase64(accountKey, zipUrl, storageName = this.storageAccountName){
    let blobStorageService = storage.createBlobService(storageName,accountKey);
    let fs = require('fs');
    let buffer = fs.readFileSync(zipUrl);
    let zip = new AdmZip(buffer);
    let zipEntries = zip.getEntries();
    let promiseArray = [];

    for (let i = 0; i < zipEntries.length; i++) {
      // console.log(zipEntries[i].entryName);
      let decompressedData = zip.readFile(zipEntries[i]);
      let stream = new Stream.PassThrough();
      stream.end(decompressedData);
      promiseArray.push(new Promise(function(resolve, reject){
        blobStorageService.createBlockBlobFromStream("$web", zipEntries[i].entryName, stream, buffer.length, {contentSettings: {contentType: mime.lookup(zipEntries[i].entryName)}} ,function (error, result, response) {
          if (error) {
            reject("Couldn't upload stream");

          } else {
            // console.log('Stream uploaded successfully: ' + i + " " + zipEntries[i].entryName + "    " +  mime.lookup(zipEntries[i].entryName));
            resolve(result);
          }
        });
      }));
    }
    return await Promise.all(promiseArray).then(() => { console.log('resolved!'); })
      .catch(() => { console.log('failed!') });
  }




  async installFunctionExtensions(appName, resourceGroup = this.resourceGroupName){
    let payload = {
      "command": "dotnet build extensions.csproj -o bin --no-incremental --packages D:\\home\\.nuget",
      "dir": "site\\wwwroot"
    }

    let client = await this.factory.getResource("WebAppManagementClient");
    let publishingCredentials = await client.webApps.listPublishingCredentials(resourceGroup, appName, null);

    return new Promise(function(resolve, reject) {
      request({
        url: `https://${appName}.scm.azurewebsites.net/api/command`,
        method: 'POST',
        body: payload,
        json: true,
        auth: {
          username: publishingCredentials.publishingUserName,
          password: publishingCredentials.publishingPassword
        },
        headers: {
          Accept: '*/*'
        }
      }, function(err, resp, body) {
        if (err) {
          console.log(body);
          reject(err);
        } else {
          resolve(resp);
        }
      })
    });


  }


  async uploadZipToKudu(appName, filename, resourceGroup = this.resourceGroupName) {
    var fs = require('fs');

    let client = await this.factory.getResource("WebAppManagementClient");
    let publishingCredentials = await client.webApps.listPublishingCredentials(resourceGroup, appName, null);
    return new Promise(function(resolve, reject) {
      request({
        url: `https://${appName}.scm.azurewebsites.net/api/zipdeploy`,
        method: 'PUT',
        body: fs.createReadStream(filename),
        encoding: null,
        auth: {
          username: publishingCredentials.publishingUserName,
          password: publishingCredentials.publishingPassword
        },
        headers: {
          Accept: '*/*'
        }
      }, function(err, resp, body) {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      })
    });
  }

  async createDependency(data) {
    return  await functionCreateHandler.createDependency(data, this.factory);

  }

  async createFunctionWithConnectionString(data) {
    let storageAccountKeys = await this.listStorageAccountKeys(data.appName);
    let storageAccountKey = storageAccountKeys.keys[0].value;
    const connectionString = await functionCreateHandler.getConnectionString(data, this.factory);
    let webApp = await this.existWebApp(data.stackName);
    if (webApp == null) {

      return await this.createFunctionApp(data.stackName, storageAccountKey, data.tags, data.appName, data.resourceGroupName, data.location, connectionString, data.runtime);
     } else {
      return webApp;
    }
  }

  async createDatabase(data) {
    return await dbHandler.createDatabase(data, await this.factory.getResource('CosmosDBManagementClient'));

  }

  async getMasterKey(stackName) {
    let token = await this.getToken(stackName);

    return new Promise(function (resolve, reject) {
      request({
        url: `https://${stackName}.azurewebsites.net/admin/host/systemkeys/_master`,
        method: 'GET',
        auth: {
          bearer: token
        }
      }, function (err, resp, body) {
        if (err) {
          reject(err);
        } else {
          let jsonOutput = JSON.parse(body);
          resolve(jsonOutput);
        }
      });
    });

  }

  async getToken(stackName, resourceGroup = this.resourceGroupName) {

    let client = await this.factory.getResource('WebAppManagementClient');
    let publishingCredentials = await client.webApps.listPublishingCredentials(resourceGroup, stackName, null);

    return new Promise(function (resolve, reject) {
      request({
        url: `https://${stackName}.scm.azurewebsites.net/api/functions/admin/token`,
        method: 'GET',
        auth: {
          username: publishingCredentials.publishingUserName,
          password: publishingCredentials.publishingPassword
        }
      }, function (err, resp, body) {
        if (err) {
          reject(err);
        } else {
          resolve(body.replace(/"/g, ''));
        }
      });
    });

  }
  async existWebApp(appName, resourceGroupName = this.resourceGroupName) {
    let client = await this.factory.getResource("WebAppManagementClient");
    return await client.webApps.get(resourceGroupName, appName);

  }

  async restartWebApp(appName, resourceGroupName = this.resourceGroupName) {
    let client = await this.factory.getResource("WebAppManagementClient");
    return await client.webApps.restart(resourceGroupName, appName);
  }
}
