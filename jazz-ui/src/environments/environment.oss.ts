export const environment = {
  production:true,
  configFile: 'config/config.oss.json',
  baseurl: "https://{API_GATEWAY_KEY_PROD}.execute-api.{inst_region}.amazonaws.com/prod",
  api_doc_name : "https://{api_doc_name}.s3.amazonaws.com",
  envName:"oss",
  multi_env:{multi_env},
  serviceTabs:["overview","logs"],
  environmentTabs:["overview"],
  urls:{
    docs_link:"https://github.com/tmobile/jazz/wiki",
    content_base: "https://raw.githubusercontent/tmobile/jazz/jazz-content/jazz-ui/"
}

};
