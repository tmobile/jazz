export const environment = {
  production:true,
  configFile: 'config/config.oss.json',
  baseurl: "https://{API_GATEWAY_KEY_PROD}.execute-api.{inst_region}.amazonaws.com/prod",
  api_doc_name : "https://{api_doc_name}.s3.amazonaws.com",
  envName:"oss",
  multi_env:{multi_env},
  serviceTabs:["{overview}","{access control}","{metrics}","{logs}","{cost}"],
  environmentTabs:["{env_overview}","{deployments}","{code quality}","{assets}","{env_logs}"],
  urls:{
    docs_link:"https://github.com/tmobile/jazz/wiki",
    content_base: "https://github.com/tmobile/jazz-content/blob/master"
}

};
