export const environment = {
  production: true,
  INSTALLER_VARS: {INSTALLER_VARS},
  configFile: 'config/config.oss.json',
  baseurl: "https://{API_GATEWAY_KEY_PROD}.execute-api.{inst_region}.amazonaws.com/prod",
  api_doc_name: "https://{api_doc_name}.s3.amazonaws.com",
  envName: "oss",
  multi_env: {multi_env},
  slack_support: {slack_support},
  webLists: { "html": "Static", "angular": "Angular", "react": "ReactJS" },
  envLists: { "nodejs10.x": "Nodejs 10.x", "nodejs8.10": "Nodejs 8.10", "python3.6": "Python 3.6", "java8": "Java 8", "go1.x": "Go 1.x", "c#": "C#" },
  serviceTabs: ["{overview}", "{access control}", "{metrics}", "{logs}", "{cost}"],
  environmentTabs: ["{env_overview}", "{deployments}", "{code quality}", "{metrics}", "{assets}", "{env_logs}"],
  assetTypeList: [
    "lambda",
    "apigateway",
    "cloudfront",
    "s3",
    "dynamodb",
    "cloudwatch_event",
    "dynamodb_stream",
    "iam_role",
    "sqs",
    "kinesis_stream",
    "apigee_proxy",
    "storage_account"
  ],
  charachterLimits: {
    eventMaxLength: {
      "stream_name": 128,
      "table_name": 255,
      "queue_name": 80,
      "bucket_name": 63
    },
    serviceName: 11,
    domainName: 10
  },
  servicePatterns: {
    "serviceName": "^[A-Za-z0-9\-]+$",
    "domainName": "^[A-Za-z0-9\-]+$",
    "slackChannel": "^[A-Za-z0-9\-_]+$",
    "streamName": "[a-zA-Z0-9_.-]+",
    "tableName": "^[A-Za-z0-9\-._]+$",
    "queueName": "[A-Za-z0-9_-]+",
    "bucketName": "[a-z0-9-]+"
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
    account_number: '{account_number}',
    region: '{region}',
    envLists: {"nodejs10.x": "Nodejs 10.x", "nodejs8.10": "Nodejs 8.10", "python3.6": "Python 3.6", "java8": "Java 8", "go1.x": "Go 1.x"},
    accountMap: {accountMap},
    default_region: '{default_region}',
    default_account: '{default_account}'
  },
  azure: {
    azure_account_number: '{azure_account_number}',
    azure_region: '{azure_region}',
    azure_enabled: {azure_enabled},
    envLists: {"nodejs8.10": "Nodejs 8.10", "c#": "C#"},
  },
  gcloud: {
    envLists:  {},
  }
};
