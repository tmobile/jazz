export const environment = {
  production: true,
  INSTALLER_VARS: { "environment_tabs": { "overview": true, "code_quality": "false", "deployments": true, "assets": true, "logs": true }, "CREATE_SERVICE": { "DEPLOYMENT_TARGETS": { "API": { "options": [{ "label": "AWS API Gateway", "value": "aws_apigateway" }, { "label": "GCP APIGEE", "value": "gcp_apigee" }], "active": true }, "FUNCTION": { "options": [{ "label": "AWS Lambda", "value": "aws_lambda" }], "active": false }, "WEBSITE": { "options": [{ "label": "AWS S3", "value": "aws_s3" }, { "label": "AWS Cloudfront", "value": "aws_cloudfront" }], "active": false } } }, "feature": { "multi_env": true, "apigee": "false" }, "service_tabs": { "overview": true, "cost": false, "access_control": true, "metrics": true, "logs": true } },
  configFile: 'config/config.oss.json',
  baseurl: "https://dbn9ruqpn3.execute-api.us-east-1.amazonaws.com/prod",
  api_doc_name: "https://multi0312-jazz-s3-api-doc-20190312053238719000000007.s3.amazonaws.com",
  envName: "oss",
  multi_env: true,
  slack_support: true,
  envLists: { "nodejs8.10": "Nodejs 8.10", "python2.7": "Python 2.7", "python3.6": "Python 3.6", "java8": "Java 8", "go1.x": "Go 1.x" },
  serviceTabs: ["overview", "{access control}", "metrics", "logs", "{cost}"],
  environmentTabs: ["overview", "deployments", "{code quality}", "metrics", "assets", "logs"],
  charachterLimits: {
    eventMaxLength: {
      "stream_name": 128,
      "table_name": 255,
      "queue_name": 80,
      "bucket_name": 63
    },
    serviceName: 20,
    domainName: 20
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
    region: "{region}",
  },
  accountMap: [{ "primary": true, "account": "102707241671", "regions": ["us-east-1"] }, { "primary": false, "account": "108206174331", "regions": ["us-west-2"] }]
};
