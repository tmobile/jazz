const CosmosClient = require("@azure/cosmos").CosmosClient;

async function create(data, client) {
  if (!await accountExists(data, client)) {

    return await createAccount(data, client);
  }
}

async function getConnectionString(data, client) {

  const connectionStrings = await client.databaseAccounts.listConnectionStrings(data.resourceGroupName, data.database_account);

  return connectionStrings.connectionStrings[0].connectionString; //AzureWebJobsCosmosDBConnectionStringName
}
async function createAccount(data, client) {

  const params = {
    location: data.location,
    databaseAccountOfferType: "Standard",
    tags: data.tags
  };
  let response = await client.databaseAccounts.createOrUpdate(data.resourceGroupName, data.database_account, params);
  return response;
}

async function createDatabase(data, client) {

  const dbAccount = await client.databaseAccounts.get(data.resourceGroupName, data.database_account);
  await createDatabaseWithEndpoint(data, client, dbAccount.documentEndpoint);
  return dbAccount;
}

async function createDatabaseWithEndpoint(data, client, endpoint) {

  const keys = await client.databaseAccounts.listKeys(data.resourceGroupName, data.database_account);
  const masterKey = keys.primaryMasterKey;

  const dbClient = new CosmosClient({ endpoint, auth: { masterKey } });
  const dbResponse = await dbClient.databases.createIfNotExists({
    id: data.database
  });
  const database = dbResponse.database;

  await database.containers.createIfNotExists({
    id: data.table
  });

  return;
}


async function accountExists(data, client) {
  let account = await client.databaseAccounts.checkNameExists(data.database_account);
  return account.body;
}

module.exports = {
  create,
  createDatabase,
  getConnectionString
};
