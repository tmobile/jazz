export const environment = {
  production: true,
  configFile: 'config/config.oss.json',
  baseurl: "https://{API_GATEWAY_KEY_PROD}.execute-api.{inst_region}.amazonaws.com/prod",
  api_doc_name: "https://{api_doc_name}.s3.amazonaws.com",
  envName: "oss",
  multi_env: {multi_env},
  slack_support: {slack_support},
  serviceTabs: ["{overview}", "{access control}", "{metrics}", "{logs}", "{cost}"],
  environmentTabs: ["{env_overview}", "{deployments}", "{code quality}", "{metrics}", "{assets}", "{env_logs}"],
  urls: {
    docs_link: "https://github.com/tmobile/jazz/wiki",
    swagger_editor: "{swagger_editor}",
    content_base: "https://github.com/tmobile/jazz-content/blob/master"
  },
  userJourney: {
    registrationMessage: 'Please contact your Jazz Admin(s) to get a registration code.'
  },
  aws:{
    account_number:"{account_number}"
  }
};
