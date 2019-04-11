
async function create(data, client){
  let output;
  const blobList = await client.blobContainers.list(data.resourceGroupName, data.appName, data.resourceName);
  if (blobList) {
    blobList.value.forEach(function(item, index, array) {
      if (item.name === data.resourceName) {
        output = item;
      }
    });
  }
  if (output) {
    return output;
  } else {
    return await client.blobContainers.create(data.resourceGroupName, data.appName, data.resourceName);
  }

}

module.exports = {
  create
};
