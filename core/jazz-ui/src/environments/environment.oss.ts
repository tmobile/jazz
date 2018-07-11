export const environment = {
  production: true,
  configFile: 'config/config.oss.json',
  baseurl: "https://p22i216yc6.execute-api.us-east-1.amazonaws.com/prod",
  api_doc_name : "https://{api_doc_name}.s3.amazonaws.com",
  envName:"oss",
  multi_env:"{multi_env}",
  serviceTabs:["{overview}","{access control}","{metrics}","{logs}","{cost}"],
  environmentTabs:["{env_overview}","{deployments}","{code quality}", "metrics", "{assets}","{env_logs}"],
  urls:{
    docs_link:"https://github.com/tmobile/jazz/wiki",
    swagger_editor: "{swagger_editor}"
  },
  userJourney: {
    registrationMessage: 'Please contact your Jazz Admin(s) to get a registration code.'
  }
};
