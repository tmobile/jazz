

async function create(data, client){

  await createNamespace(data, client);
  let response = await createQueue(data, client);
  return response;
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


async function createQueue(data, client) {

  if (!await queueExists(data, client)) {

    let params = {
      location: data.location,
      tags: data.tags
    };
    return await client.queues.createOrUpdate(data.resourceGroupName, data.namespace, data.resourceName, params);
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
  const result = await client.namespaces.checkNameAvailabilityMethod(params);
  return result.nameAvailable;
}


async function queueExists(data, client) {

  const queueList = await client.queues.listByNamespace(data.resourceGroupName, data.namespace);
  if (queueList) {
    for(const queue of queueList) {
      if (queue.name == data.resourceName) {
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
