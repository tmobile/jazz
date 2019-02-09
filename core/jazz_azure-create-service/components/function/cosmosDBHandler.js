// const CosmosDBManagementClient = require('azure-arm-cosmosdb');
const CosmosClient = require("@azure/cosmos").CosmosClient;
const logger = require("../logger.js");
async function create(data, client) {

  // let client  = new CosmosDBManagementClient(serviceClientCredentials, data.subscriptionId);
  let output = {};
  logger.debug('dbaccount create starting...');
  const dbAccount = await createAccount(data, client);
  logger.debug('dbaccount created id ' + dbAccount.id);
  logger.debug('dbaccount created name ' + dbAccount.name);
  output.stack = dbAccount;

  let connectionStrings = await client.databaseAccounts.listConnectionStrings(data.resourceGroupName, data.appName);
  logger.debug('dbaccount connection string ' + connectionStrings);
  output.connectionString = connectionStrings.connectionStrings[0].connectionString; //AzureWebJobsCosmosDBConnectionStringName

  await createDatabase(data, client, dbAccount.documentEndpoint);

  return output;

}

async function createAccount(data, client) {

  let params = {
    location: data.location,
    databaseAccountOfferType: "Standard"
  };

  return await client.databaseAccounts.createOrUpdate(data.resourceGroupName, data.appName, params);

}

async function createDatabase(data, client, endpoint)
{

  let keys = await client.databaseAccounts.listKeys(data.resourceGroupName, data.appName);
  const masterKey = keys.primaryMasterKey;

  const dbClient = new CosmosClient({ endpoint, auth: { masterKey } });

  logger.debug("Setting up the database...");
  const dbResponse = await dbClient.databases.createIfNotExists({
    id: data.resourceName
  });
  const database = dbResponse.database;

  await database.containers.createIfNotExists({
    id: data.resourceName
  });

  return;

}
module.exports = {
  create
};
