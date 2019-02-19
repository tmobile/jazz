
async function create(data, client){

  return await createNamespaceAndHub(client, data);
}


async function createNamespaceAndHub(client, data) {
  let params = {
    location: data.location,
    tags: data.tags
  };

  const namespace = await client.namespaces.createOrUpdate(data.resourceGroupName, data.appName, params);
  await client.eventHubs.createOrUpdate(data.resourceGroupName, data.appName, data.resourceName, params);
  return namespace;

}

async function getConnectionString(data, client) {

  const keys = await client.namespaces.listKeys(data.resourceGroupName, data.appName, 'RootManageSharedAccessKey');
  return keys.primaryConnectionString;
}

module.exports = {
  create,
  getConnectionString
};
