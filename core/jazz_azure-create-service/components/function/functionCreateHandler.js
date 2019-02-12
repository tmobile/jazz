const sbHandler = require('./servicebusHandler');
const dbHandler = require('./cosmosDBHandler');
const ehHandler = require('./eventhubHandler');
const storageHandler = require('./storageblobHandler');
const logger = require("../logger.js");

async function createDependency(data, factory) {

  let type = data.eventSourceType;
  let resource;
  switch (type) {
    case 'Storage':
      resource = await storageHandler.create(data, await factory.getResource('StorageManagementClient'));
      break;
    case 'CosmosDB':
      resource = await dbHandler.create(data, await factory.getResource('CosmosDBManagementClient'));
      break;
    case 'EventHubs':
      resource = await ehHandler.create(data, await factory.getResource('EventHubManagementClient'));
      break;
    case 'ServiceBus':
      resource = await sbHandler.create(data, await factory.getResource('ServiceBusManagementClient'));
      break;
    default:
      logger.error('Unknown type ' + type);
  }

  return resource;
}


async function getConnectionString(data, factory) {

  let type = data.eventSourceType;
  let resource;
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
      logger.info('No connection string for this type ' + type);
  }

  return resource;
}

module.exports = {
  createDependency,
  getConnectionString
};
