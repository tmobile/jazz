
async function create(data, client){

  let output = {
    connectionString: ''
  };

  const stack = await client.blobContainers.create(data.resourceGroupName, data.appName, data.resourceName);
  output.stack = stack;
  return output;

}

module.exports = {
  create
};
