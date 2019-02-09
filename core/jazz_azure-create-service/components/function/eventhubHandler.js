


async function create(data, client){
  console.log('execute eventhub creation.......');

  let output = {};
  // const client = new EventHubManagementClient(serviceClientCredentials, data.subscriptionId);
  output.stack = await createNamespaceAndHub(client, data);
  output.connectionString = await getKey(client, data);

  return output;
}

async function createNamespaceAndHub(client, data) {
  let params = {
    location: data.location
  };

  // let result = await client.namespaces.checkNameAvailability({name:data.uniqueName});
  const namespace = await client.namespaces.createOrUpdate(data.resourceGroupName, data.appName, params);
  await client.eventHubs.createOrUpdate(data.resourceGroupName, data.appName, data.resourceName, params);
  return namespace;

}

async function getKey(client, data) {

  const keys = await client.namespaces.listKeys(data.resourceGroupName, data.appName, 'RootManageSharedAccessKey');
  return keys.primaryKey;
}

module.exports = {
  create
};
