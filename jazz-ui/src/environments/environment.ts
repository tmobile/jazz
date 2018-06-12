export const environment = {
    production:false,
    configFile: 'config/config.prod.json',
    baseurl: "https://{API_GATEWAY_KEY_PROD}.execute-api.{inst_region}.amazonaws.com/prod",
    api_doc_name : "https://{api_doc_name}.s3.amazonaws.com",
    envName:"jazz",
    multi_env:false,
  serviceTabs:["{overview}","{access control}","{metrics}","{logs}","{cost}"],
  environmentTabs:["{env_overview}","{deployments}","{code quality}","{assets}","{env_logs}"],
    urls:{},
    userJourney: {
      registrationMessage: ''
    }
};
