export const environment = {
  production:true,
  configFile: 'config/config.oss.json',
  baseurl: "https://p1cgv1qy3c.execute-api.us-east-1.amazonaws.com/prod",
  api_doc_name : "https://{api_doc_name}.s3.amazonaws.com",
  envName:"oss",
  multi_env:true,
  serviceTabs:["overview","access control","metrics","logs","cost"],
  environmentTabs:["overview","deployments","code quality","assets","env_logs"],
  urls:{
    docs_link:"https://github.com/tmobile/jazz/wiki",
  },
  userJourney: {
    registrationMessage: 'Please contact your Jazz Admin(s) to get a registration code.'
  }

};
