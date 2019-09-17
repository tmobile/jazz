const CommandMapping = require("./components/CommandMapping.js");
const fs = require('fs');

module.exports = async () => {
  const args = process.argv.slice(2);
  let cmd = args[0];
  let result;
  try {
    let text = fs.readFileSync(cmd);
    let obj = JSON.parse(text);
    let commandMapping = new CommandMapping();
    result = await commandMapping.process(obj);
    console.log(JSON.stringify({
      result: result
    }));
  } catch (error) {
    console.log(JSON.stringify({
      error: error.toString()
    }));
  }
}