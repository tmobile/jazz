export const nodejsTemplate = {
    template:
`service:
  name:sls
provider:
  name: aws
  region: us-east-1
stackTags:
  application: sls190521
  service: testplugins
  domain: testjazz
  owner: serverless@t-mobile.com
  environment: prod
functions: 
  function1: 
    handler: function1/index.handler
    events:
      - s3: 
          bucket:s3bucket
          events:s3events
  function2:
    handler: function2/index.handler
resources:
  Resources:
    myresources:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: table-name
    notherresources:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: table-nameres
  `
};