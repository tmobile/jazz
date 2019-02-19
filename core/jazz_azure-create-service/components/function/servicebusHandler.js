

async function create(data, client){

  return await createNamespaceAndQueue(data, client);
}

async function createNamespaceAndQueue(data, client){

  let params = {
    location: data.location,
    tags: data.tags
  };

  let namespace = await client.namespaces.createOrUpdate(data.resourceGroupName, data.appName, params);
  await client.queues.createOrUpdate(data.resourceGroupName, data.appName, data.resourceName, params);
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
