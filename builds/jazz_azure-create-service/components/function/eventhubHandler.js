

async function create(data, client){

  await createNamespace(data, client);
  if (!await eventHubsExists(data, client)) {

    let params = {
      location: data.location,
      tags: data.tags
    };
    return await client.eventHubs.createOrUpdate(data.resourceGroupName, data.namespace, data.resourceName, params);
  }
}

async function createNamespace(data, client) {

  if (await namespaceAvailable(data, client)) {

    let params = {
      location: data.location,
      tags: data.tags
    };

   return await client.namespaces.createOrUpdate(data.resourceGroupName, data.namespace, params);
  }
}

async function getConnectionString(data, client) {

  const keys = await client.namespaces.listKeys(data.resourceGroupName, data.namespace, 'RootManageSharedAccessKey');
  return keys.primaryConnectionString;
}


async function namespaceAvailable(data, client) {

  let params = {
    name: data.namespace
  };
  const result = await client.namespaces.checkNameAvailability(params);
  return result.nameAvailable;

}


async function eventHubsExists(data, client) {

  const hubList = await client.eventHubs.listByNamespace(data.resourceGroupName, data.namespace);
  if (hubList) {
    for(const item of hubList) {
      if (item.name == data.resourceName) {
        return true;
      }
    }
  }
  return false;

}

module.exports = {
  create,
  getConnectionString
};
