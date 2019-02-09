// const CosmosDBManagementClient = require('azure-arm-cosmosdb');
const CosmosClient = require("@azure/cosmos").CosmosClient;

async function create(data, client) {

  // let client  = new CosmosDBManagementClient(serviceClientCredentials, data.subscriptionId);
  let output = {};

  const dbAccount = await createAccount(data, client);
  output.stack = dbAccount;

  let connectionStrings = await client.databaseAccounts.listConnectionStrings(data.resourceGroupName, data.appName);
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

  console.log("Setting up the database...");
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
