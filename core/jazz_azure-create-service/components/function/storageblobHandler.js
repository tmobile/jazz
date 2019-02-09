
const StorageManagementClient = require('azure-arm-storage');
const ResourceFactory = require('../ResourceFactory');

async function create(data, client){
  console.log('execute login.......');

  let output = {
    connectionString: ''
  };

  let params = {
    location: data.location
  };

  // let resourceFactory = new ResourceFactory();
  // let storageAccount = await resourceFactory.createStorageAccount(data.resourceGroupName, data.uniqueName, data.subscriptionId, serviceClientCredentials);

  // let client = new StorageManagementClient(serviceClientCredentials, data.subscriptionId);
  const stack = await client.blobContainers.create(data.resourceGroupName, data.appName, data.resourceName);
  output.stack = stack;
  return output;

}

module.exports = {
  create
};
