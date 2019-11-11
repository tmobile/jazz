const sbHandler = require('./servicebusHandler');
const dbHandler = require('./cosmosDBHandler');
const ehHandler = require('./eventhubHandler');
const storageHandler = require('./storageblobHandler');

async function createDependency(data, factory) {

  let type = data.eventSourceType;
  let responseValue;

  switch (type) {
    case 'Storage':
      responseValue = await storageHandler.create(data, await factory.getResource('StorageManagementClient'));
      break;
    case 'CosmosDB':
      responseValue = await dbHandler.create(data, await factory.getResource('CosmosDBManagementClient'));
      break;
    case 'EventHubs':
      responseValue = await ehHandler.create(data, await factory.getResource('EventHubManagementClient'));
      break;
    case 'ServiceBus':
      responseValue = await sbHandler.create(data, await factory.getResource('ServiceBusManagementClient'));
      break;
    default:
  }

  return responseValue;

}


async function getConnectionString(data, factory) {

  let type = data.eventSourceType;
  let resource = '';
  switch (type) {
    case 'CosmosDB':
      resource = await dbHandler.getConnectionString(data, await factory.getResource('CosmosDBManagementClient'));
      break;
    case 'EventHubs':
      resource = await ehHandler.getConnectionString(data, await factory.getResource('EventHubManagementClient'));
      break;
    case 'ServiceBus':
      resource = await sbHandler.getConnectionString(data, await factory.getResource('ServiceBusManagementClient'));
      break;
    default:
  }

  return resource;
}

module.exports = {
  createDependency,
  getConnectionString
};
