export const environment = {
  production:true,
  configFile: 'config/config.oss.json',
  baseurl: "https://{API_GATEWAY_KEY_PROD}.execute-api.{inst_region}.amazonaws.com/prod",
  api_doc_name : "https://{api_doc_name}.s3.amazonaws.com",
  envName:"oss",
  multi_env:{multi_env},
  serviceTabs:["overview","logs"],
  environmentTabs:["overview"],
  urls:{}
};

// export const environment = {
//   production:false,
//   configFile: 'config/config.oss.json',
//   baseurl: "https://l3gq4futgk.execute-api.us-east-1.amazonaws.com/prod",
//   api_doc_name : "https://{api_doc_name}.s3.amazonaws.com",
//   envName:"oss",
//   multi_env:false,
//   serviceTabs:["overview","logs"],
//   environmentTabs:["overview"],
//   urls:{}
// };
