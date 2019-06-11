// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

const assert = require('chai').assert;
const expect = require('chai').expect;
const slsYmlValidator = require('../components/validate-sls-yml');

describe('validate-sls-yml', function () {

  it("should return empty resource list if all resources are allowed", function () {

    const dynamoDbOnly =
`resources:
  Resources:
    usersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: usersTable
        AttributeDefinitions:
          - AttributeName: email
            AttributeType: S
        KeySchema:
          - AttributeName: email
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1`;
    const outstandingResources = slsYmlValidator.validateResources(dynamoDbOnly);

    assert.isTrue(outstandingResources.length==0);
  });

  it("should return empty resource list if no resources element is present in dd", function () {
    const noResources = 'service: name';
    const outstandingResources = slsYmlValidator.validateResources(noResources);
    assert.isTrue(outstandingResources.length==0);
  });


  it("should return a non-empty list with all outstanding resources", function () {
    const dynamo_CodeCommit_Ec2 =
`resources:
  Resources:
    usersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: usersTable
        AttributeDefinitions:
          - AttributeName: email
            AttributeType: S
        KeySchema:
          - AttributeName: email
            KeyType: HASH
        ProvisionedThroughput:
          ReadCapacityUnits: 1
          WriteCapacityUnits: 1
    sourceCodeRepo:
      Type: AWS::CodeCommit::Repository
      Properties:
        RepositoryDescription: 'cool Repo'
        RepositoryName: myCoolRepository
    myEc2:
      Type: AWS::EC2::Instance
      Properties:
        ImageId: "ami-79fd7eee"
        KeyName: "testkey"
        BlockDeviceMappings:
          - DeviceName: "/dev/sdm"
            Ebs:
              VolumeType: "io1"
              Iops: "200"
              DeleteOnTermination: "false"
              VolumeSize: "20"
          - DeviceName: "/dev/sdk"
            NoDevice: {}
`;
    const outstandingResources = slsYmlValidator.validateResources(dynamo_CodeCommit_Ec2);

    assert.isTrue(outstandingResources.length==2);
    assert.isTrue(outstandingResources.includes('AWS::CodeCommit::Repository'));
    assert.isTrue(outstandingResources.includes('AWS::EC2::Instance'));
  });

  it("should throw an exception on an invalid yml", function () {
    const invalidYml=
    `
    greeting:
  - hello name: - world`;
    let errorFlag = false;
    try {
      slsYmlValidator.validateResources(invalidYml);
    } catch(e) {
      assert.equal('YAMLException', e.name);
      errorFlag = true;
    }
    assert.isTrue(errorFlag);
  });

  it("should return an empty list of outstanding events if no events are not mentioned in dd", function() {
    const justName = "service: cool";
    const outstandingEvents = slsYmlValidator.validateEvents(justName);
    assert.isTrue(outstandingEvents.length==0);
  });

  it("should return an empty list of outstanding events if all events are allowed in whitelist", function() {
    const bunchOfAllowedEvents = `
functions:
  handler:
    events:
      - schedule:
          rate: 55
          enabled: true
      - stream:
          type: dynamodb
          batchSize: 1
          startingPosition: LATEST
          enabled: true
      - sqs:
          enabled: true
          arn: arn:aws:sqs:us-east-1:123456789012:test
      - stream:
          type: kinesis
          startingPosition: LATEST
          enabled: true
          arn: arn:aws:kinesis:us-east-1:123456789012:stream/hub-dev
      - s3:\n
          bucket: jaztest-bucket123
          event: s3:PutObject
`
    const outstandingEvents = slsYmlValidator.validateEvents(bunchOfAllowedEvents);
    assert.isTrue(outstandingEvents.length==0);
  });

  it("should return an outstandig event if such present", function() {
    const threeForbiddenEvents = `
functions:
  handler:
    events: \n
      - schedule: \n
          rate: 55 \n
          enabled: true
      - sns:
          enabled: true
          arn: arn:aws:sns:us-east-1:902907241619:test
      - stream: \n
          type: redshift
          startingPosition: LATEST
          enabled: true
          arn: arn:aws:redshift:us-east-1:442707241652:stream/lsn
      - stream:
          type: firehose
          startingPosition: LATEST
          enabled: true
          arn: arn:aws:firehose:us-east-1:842707241659:stream/fh
`;
    const outstandingEvents = slsYmlValidator.validateEvents(threeForbiddenEvents);
    assert.isTrue(outstandingEvents.length==3);
    assert.isTrue(outstandingEvents.includes('sns'));
    assert.isTrue(outstandingEvents.includes('stream:redshift'));
    assert.isTrue(outstandingEvents.includes('stream:firehose'));
  });

  it("should return an outstandig events for more than one function if such present", function() {
    const threeForbiddenEvents = `
functions:
  handler:
    events: \n
      - schedule: \n
          rate: 55 \n
          enabled: true
      - sns:
          enabled: true
          arn: arn:aws:sns:us-east-1:902907241619:test
      - stream: \n
          type: redshift
          startingPosition: LATEST
          enabled: true
          arn: arn:aws:redshift:us-east-1:442707241652:stream/lsn
  anotherFucntion:
    events: \n
      - stream:
          type: firehose
          startingPosition: LATEST
          enabled: true
          arn: arn:aws:firehose:us-east-1:842707241659:stream/fh
      - sqs: \n
          enabled: true \n
          arn: arn:aws:sqs:us-east-1:212707241671:stream/sqs
  thirdFunction:
    name: withoutAnyEvents
`;
    const outstandingEvents = slsYmlValidator.validateEvents(threeForbiddenEvents);
    assert.isTrue(outstandingEvents.length==3);
    assert.isTrue(outstandingEvents.includes('sns'));
    assert.isTrue(outstandingEvents.includes('stream:redshift'));
    assert.isTrue(outstandingEvents.includes('stream:firehose'));
  });

  it("provider/iamRoleStatements: should return an empty list of outstanding actions if all actions're in whitelist", function() {
    const bunchOfAllowedActions = `
service: new-service
provider:
  name: aws
  iamRoleStatements:
    - Effect: "Allow"
      Action:
        - "s3:ListBucket"
        - "s3:PutObject"
      Resource:
        Fn::Join:
          - ""
          - - "arn:aws:s3:::"
          - Ref: ServerlessDeploymentBucket
    - Effect: "Allow"
      Action:
        - "dynamodb:GetItem"
        - "dynamodb:PutItem"
    - Effect: "Deny"
      Action:
        - "ec2:CopyImage"
`
    const outstandingActions = slsYmlValidator.validateActions(bunchOfAllowedActions);
    assert.isTrue(outstandingActions.length==0);
  });

  it("provider/iamRoleStatements: should return two rogue actions", function() {
    const twoRogueActions = `
service: new-service
provider:
  name: aws
  iamRoleStatements:
    - Effect: "Allow"
      Action:
        - "s3:ListBucket"
        - "s3:PutObject"
      Resource:
        Fn::Join:
          - ""
          - - "arn:aws:s3:::"
          - Ref: ServerlessDeploymentBucket
    - Effect: "Allow"
      Action:
        - "dynamodb:GetItem"
        - "dynamodb:PutItem"
    - Effect: "Allow"
      Action:
        - "ec2:CopyImage"
        - "ec2:CreateLaunchTemplate"
`
    const outstandingActions = slsYmlValidator.validateActions(twoRogueActions);
    console.log('outstandingActions=>', outstandingActions);
    assert.isTrue(outstandingActions.length==2);
    assert.isTrue(outstandingActions.includes('ec2:CopyImage'));
    assert.isTrue(outstandingActions.includes('ec2:CreateLaunchTemplate'));
  });

  it("resource/Resources/role[Type='AWS:IAM:Role]/Policies/Statement': should return an empty list of outstanding actions if all actions're in whitelist", function() {
    const bunchOfAllowedActions = `
resources:
  Resources:
    myDefaultRole:
      Type: AWS::IAM::Role
      Properties:
        Path: /my/default/path/
        RoleName: MyDefaultRole # required if you want to use 'serverless deploy --function' later on
        AssumeRolePolicyDocument:
          Version: '2017'
          Statement:
            - Effect: Allow
              Principal:
                Service:
                  - lambda.amazonaws.com
              Action: sts:AssumeRole
        # note that these rights are needed if you want your function to be able to communicate with resources within your vpc
        ManagedPolicyArns:
          - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
        Policies:
          - PolicyName: myPolicyName
            PolicyDocument:
              Version: '2017'
              Statement:
                - Effect: Allow # note that these rights are given in the default policy and are required if you want logs out of your lambda(s)
                  Action:
                    - logs:CreateLogGroup
                    - logs:CreateLogStream
                    - logs:PutLogEvents
                  Resource:
                    - 'Fn::Join':
                      - ':'
                      -
                        - 'arn:aws:logs'
                        - Ref: 'AWS::Region'
                        - Ref: 'AWS::AccountId'
                        - 'log-group:/aws/lambda/*:*:*'
                -  Effect: "Allow"
                   Action:
                     - "s3:PutObject"
                   Resource:
                     Fn::Join:
                       - ""
                       - - "arn:aws:s3:::"
                         - "Ref" : "ServerlessDeploymentBucket"
    myOtherRole:
      Type: AWS::IAM::Role
      Properties:
      Policies:
        - PolicyName: myOtherPolicyName
          PolicyDocument:
            Version: '2017'
            Statement:
              - Effect: Allow
                Action:
                 - kinesis:GetRecords
                 - kinesis:PutRecord
`
    const outstandingActions = slsYmlValidator.validateActions(bunchOfAllowedActions);
    assert.isTrue(outstandingActions.length==0);
  });

  it("resource/Resources/role[Type='AWS:IAM:Role]/Policies/Statement: should return two rogue actions", function() {
    const twoRogueActions = `
resources:
  Resources:
    oneRogueRole:
      Type: AWS::IAM::Role
      Properties:
        Path: /my/default/path/
        # note that these rights are needed if you want your function to be able to communicate with resources within your vpc
        ManagedPolicyArns:
          - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
        Policies:
          - PolicyName: myPolicyName
            PolicyDocument:
              Version: '2017'
              Statement:
                - Effect: Allow # note that these rights are given in the default policy and are required if you want logs out of your lambda(s)
                  Action:
                    - logs:CreateLogGroup
                    - logs:CreateLogStream
                    - logs:PutLogEvents
                  Resource:
                    - 'Fn::Join':
                      - ':'
                      -
                        - 'arn:aws:logs'
                        - Ref: 'AWS::Region'
                        - Ref: 'AWS::AccountId'
                        - 'log-group:/aws/lambda/*:*:*'
                - Effect: "Allow"
                  Action:
                   - "s3:PutObject"
                  Resource:
                   Fn::Join:
                     - ""
                     - - "arn:aws:s3:::"
                       - "Ref" : "ServerlessDeploymentBucket"
                - Effect: "Allow"
                  Action:
                    - "ec2:CopyImage"
    perfectlyFineRole:
      Type: AWS::IAM::Role
      Properties:
        Policies:
          - PolicyName: myOtherGoodName
            PolicyDocument:
              Version: '2017'
              Statement:
                - Effect: Allow
                  Action:
                   - dynamodb:GetRecords
                   - dynamodb:PutItem
    otherRogueRole:
      Type: AWS::IAM::Role
      Properties:
        Policies:
          - PolicyName: myOtherRogueName
            PolicyDocument:
              Version: '2017'
              Statement:
                - Effect: Allow
                  Action:
                   - kinesis:GetRecords
                   - kinesis:PutRecord
                - Effect: Allow
                  Action: "ec2:CreateLaunchTemplate"
    `
    const outstandingActions = slsYmlValidator.validateActions(twoRogueActions);
    console.log('outstandingActions=>', outstandingActions);
    assert.isTrue(outstandingActions.length==2);
    assert.isTrue(outstandingActions.includes('ec2:CopyImage'));
    assert.isTrue(outstandingActions.includes('ec2:CreateLaunchTemplate'));
  });





});
