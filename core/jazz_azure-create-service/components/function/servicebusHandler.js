

async function create(data, client){
  console.log('execute servicebus creation.......');

  let output = {};

//  let client = new ServiceBusManagementClient(serviceClientCredentials, data.subscriptionId);
  output.stack = await createNamespaceAndQueue(data, client);
  output.connectionString = await getKey(client, data);

  return output;
}

async function createNamespaceAndQueue(data, client){

  let params = {
    location: data.location
  };

  let namespace = await client.namespaces.createOrUpdate(data.resourceGroupName, data.appName, params);
  await client.queues.createOrUpdate(data.resourceGroupName, data.appName, data.resourceName, params);
  return namespace;
}

async function getKey(client, data) {

  const keys = await client.namespaces.listKeys(data.resourceGroupName, data.appName, 'RootManageSharedAccessKey');
  return keys.primaryKey;
}


module.exports = {
  create
};
