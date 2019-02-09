const sbHandler = require('./servicebusHandler');
const dbHandler = require('./cosmosDBHandler');
const ehHandler = require('./eventhubHandler');
const storageHandler = require('./storageblobHandler');

// const eventMap = new Map();

async function createDependency(data, factory) {

  let type = data.eventSourceType;
  let resource;

  switch (type) {
    case 'Storage': //default all set
      return  await storageHandler.create(data, await factory.getResource('StorageManagementClient'));

    case 'CosmosDB': //AzureWebJobsCosmosDBConnectionStringName
      return await dbHandler.create(data, await factory.getResource('CosmosDBManagementClient'));

    case 'EventHubs': //SAS_CONNSTR
      return  await ehHandler.create(data, await factory.getResource('EventHubManagementClient'));

    case 'ServiceBus': //SAS_CONNSTR
      return await sbHandler.create(data, await factory.getResource('ServiceBusManagementClient'));
    //   break;
    default:
      console.log('Sorry, we are out of ' + type + '.');
  }

}

module.exports = {
  createDependency

};
