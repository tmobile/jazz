export const environment = {
  production: true,
  INSTALLER_VARS: {
    "CREATE_SERVICE": {
      "DEPLOYMENT_TARGETS": {
          "API": {
              "active": true,
              "options": [
                  {"label": "AWS API Gateway", "value": "aws_apigateway"},
                  {"label": "GCP APIGEE", "value": "gcp_apigee"}
              ]
          },
          "WEBSITE": {
              "active": false,
              "options": [
                  {"label": "AWS S3", "value": "aws_s3"},
                  {"label": "AWS Cloudfront", "value": "aws_cloudfront"}
              ]
          },
          "FUNCTION": {
              "active": false,
              "options": [
                  {"label": "AWS Lambda", "value": "aws_lambda"}
              ]
          },
          "CUSTOM":{
              "active":false,
              "options":[]

          }
      }
    },
    "feature": {
        "multi_env": true,
        "apigee": "true"
    },
    "service_tabs": {
        "overview": true,
        "access_control": true,
        "metrics": true,
        "logs": true,
        "cost": false
    },
    "environment_tabs": {
        "overview": true,
        "deployments": true,
        "code_quality": "false",
        "logs": true,
        "assets": true
    }
},
  configFile: 'config/config.oss.json',
  baseurl: "https://lp5zztke62.execute-api.us-east-1.amazonaws.com/prod",
  api_doc_name: "https://{api_doc_name}.s3.amazonaws.com",
  envName: "oss",
  multi_env: true,
  slack_support: true,
  envLists:  {"nodejs8.10": "Nodejs 8.10", "python2.7": "Python 2.7", "python3.6": "Python 3.6", "java8": "Java 8", "go1.x": "Go 1.x"},
  serviceTabs: ["{overview}", "{access control}", "{metrics}", "{logs}", "{cost}"],
  environmentTabs: ["{env_overview}", "{deployments}", "{code quality}", "{metrics}", "{assets}", "{env_logs}"],
  charachterLimits:{
    eventMaxLength:{
      "stream_name":128,
      "table_name":255,
      "queue_name":80,
      "bucket_name":63
    },
    serviceName:20,
    domainName:20
  },
  servicePatterns:{
    "serviceName":"^[A-Za-z0-9\-]+$",
    "domainName":"^[A-Za-z0-9\-]+$",
    "slackChannel":"^[A-Za-z0-9\-_]+$",
    "streamName":"[a-zA-Z0-9_.-]+",
    "tableName":"^[A-Za-z0-9\-._]+$",
    "queueName":"[A-Za-z0-9_-]+",
    "bucketName":"[a-z0-9-]+"
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
    account_number:'{account_number}',
    region:"{region}"
  },
  deploymentDescriptorText:
`
-  API:
    name: test-service
    namespace: jazztest
    runtime:
      - python
-  Lambda:
    name: test-lambda
    namespace: jazztest
    runtime:
      - java
`
};
