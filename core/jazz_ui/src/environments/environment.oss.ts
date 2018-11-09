export const environment = {
  production: true,
  configFile: 'config/config.oss.json',
  baseurl: "https://i0tyw45v91.execute-api.us-east-1.amazonaws.com/prod",
  api_doc_name: "https://{api_doc_name}.s3.amazonaws.com",
  envName: "oss",
  multi_env: true,
  slack_support: true,
  serviceTabs: ["overview", "access control", "metrics", "logs", "cost"],
  environmentTabs: ["env_overview", "deployments", "code quality", "metrics", "assets", "env_logs"],
  charachterLimits:{
    eventMaxLength:{
      "stream_name":128,
      "table_name":200,
      "queue_name":80,
      "bucket_name":63
    },
    serviceName:20,
    domainName:20
  },
  urls: {
    docs_link: "https://github.com/tmobile/jazz/wiki",
    swagger_editor: "{swagger_editor}",
    content_base: "https://github.com/tmobile/jazz-content/blob/master"
  },
  userJourney: {
    registrationMessage: 'Please contact your Jazz Admin(s) to get a registration code.'
  },
  aws: {
    account_number:'102707241671',
    region:"us-east-1",
  }
};
