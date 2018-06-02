export const environment = {
  production:true,
  configFile: 'config/config.oss.json',
  baseurl: "https://j90ruh2nr5.execute-api.us-east-1.amazonaws.com/prod",
  api_doc_name : "https://jazz20180601-jazz-s3-api-doc-20180601112438813900000010.s3.amazonaws.com",
  envName:"oss",
  multi_env:"{multi_env}",
  serviceTabs:["{overview}","{access control}","{metrics}","{logs}","{cost}"],
  environmentTabs:["overview", "deployments", "code quality", "assets", "logs"],
  urls:{
    docs_link:"https://github.com/tmobile/jazz/wiki",
    swagger_editor: 'http://editor.swagger.io',
  },
  swaggerLocation: (domain, name, env) => {
    return '/' + domain + '/' + name+ '/' + env +'/swagger.json';
  }

};
