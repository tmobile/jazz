#!groovy?

whiteListContent = '''
resources:
  DynamoDB:
    - Type: "AWS::DynamoDB::Table"
      Action2Resource:
        - BatchWriteItem : "*"
        - ConditionCheck : "*"
        - CreateBackup : "*"
        - CreateGlobalTable : "${service-name}-*"
        - CreateTable : "${service-name}-*"
        - DeleteBackup : "${service-name}-*"
        - DeleteItem : "${service-name}-*"
        - DeleteTable : "${service-name}-*"
        - DescribeBackup : "*"
        - DescribeContinuousBackups : "*"
        - DescribeGlobalTable : "*"
        - DescribeGlobalTableSettings : "*"
        - DescribeLimits : "*"
        - DescribeReservedCapacity : "*"
        - DescribeReservedCapacityOfferings : "*"
        - DescribeStream : "*"
        - DescribeTable : "*"
        - DescribeTimeToLive : "*"
        - EnclosingOperation : "*"
        - GetItem : "*"
        - GetRecords : "*"
        - GetShardIterator : "*"
        - ListBackups : "*"
        - ListGlobalTables : "*"
        - ListStreams : "*"
        - ListTables : "*"
        - ListTagsOfResource : "*"
        - PurchaseReservedCapacityOfferings : "*"
        - PutItem : "*"
        - Query : "*"
        - RestoreTableFromBackup : "*"
        - RestoreTableToPointInTime : "*"
        - Scan : "*"
        - TagResource : "*"
        - UntagResource : "*"
        - UpdateContinuousBackups : "*"
        - UpdateGlobalTable : "*"
        - UpdateGlobalTableSettings : "*"
        - UpdateItem : "*"
        - UpdateTable : "*"
        - UpdateTimeToLive : "*"
  ApiGateway:
    - Type: "AWS::ApiGateway::Account"
    - Type: "AWS::ApiGateway::ApiKey"
    - Type: "AWS::ApiGateway::Authorizer"
    - Type: "AWS::ApiGateway::BasePathMapping"
    - Type: "AWS::ApiGateway::ClientCertificate"
    - Type: "AWS::ApiGateway::Deployment"
    - Type: "AWS::ApiGateway::DocumentationPart"
    - Type: "AWS::ApiGateway::DocumentationVersion"
    - Type: "AWS::ApiGateway::DomainName"
    - Type: "AWS::ApiGateway::GatewayResponse"
    - Type: "AWS::ApiGateway::Method"
    - Type: "AWS::ApiGateway::Model"
    - Type: "AWS::ApiGateway::RequestValidator"
    - Type: "AWS::ApiGateway::Resource"
    - Type: "AWS::ApiGateway::RestApi"
    - Type: "AWS::ApiGateway::Stage"
    - Type: "AWS::ApiGateway::UsagePlan"
    - Type: "AWS::ApiGateway::UsagePlanKey"
    - Type: "AWS::ApiGateway::VpcLink"
  LambdaFunction:
    - Type: "AWS::Lambda::EventSourceMapping"
    - Type: "AWS::Lambda::Function"
    - Type: "AWS::Lambda::Alias"
    - Type: "AWS::Lambda::LayerVersion"
    - Type: "AWS::Lambda::LayerVersionPermission"
    - Type: "AWS::Lambda::Permission"
    - Type: "AWS::Lambda::Version"
  S3:
    - Type: "AWS::S3::Bucket"
    - Type: "AWS::S3::BucketPolicy"
  CloudFront:
    - Type: "AWS::CloudFront::Distribution"
    - Type: "AWS::CloudFront::CloudFrontOriginAccessIdentity"
    - Type: "AWS::CloudFront::StreamingDistribution"
  SQS:
    - Type: "AWS::SQS::Queue"
    - Type: "AWS::SQS::QueuePolicy"
  Kinesis:
    - Type: "AWS::Kinesis::Stream"
    - Type: "AWS::Kinesis::StreamConsumer"
    - Type: "AWS::KinesisFirehose::DeliveryStream"
    - Type: "AWS::KinesisAnalytics::Application"
    - Type: "AWS::KinesisAnalytics::ApplicationOutput"
    - Type: "AWS::KinesisAnalytics::ApplicationReferenceDataSource"
  IAM:
    - Type: "AWS::IAM::AccessKey"
    - Type: "AWS::IAM::Group"
    - Type: "AWS::IAM::InstanceProfile"
    - Type: "AWS::IAM::Group"
    - Type: "AWS::IAM::Policy"
    - Type: "AWS::IAM::Role"
    - Type: "AWS::IAM::ServiceLinkedRole"
    - Type: "AWS::IAM::User"
    - Type: "AWS::IAM::UserToGroupAddition"
  CloudWatch:
    - Type: "AWS::CloudWatch::Alarm"
    - Type: "AWS::CloudWatch::Dashboard"
    - Type: "AWS::Events::Rule"
    - Type: "AWS::Events::EventBusPolicy"
    - Type: "AWS::Logs::Destination"
    - Type: "AWS::Logs::LogGroup"
    - Type: "AWS::Logs::LogStream"
    - Type: "AWS::Logs::MetricFilter"
    - Type: "AWS::Logs::SubscriptionFilter"

events:
  schedule:
  stream:
    - type: kinesis
    - type: dynamodb
  sqs:
  s3:
'''

whiteList = readYaml(text: whiteListContent)
underResources = whiteList['resources'].collect{key, val -> val}
allowedResources = underResources.collect{firstLevel -> firstLevel.collect{secondLevel -> secondLevel['Type']}}.flatten()

def validate(cftJson) {
  def outstandingResources = []
  def templateUnderResources = cftJson['Resources']
  if(templateUnderResources != null) {
      def allTargetResourceTypes = templateUnderResources.collect{key, val -> val}['Type']
      outstandingResources = allTargetResourceTypes.clone()
      outstandingResources.removeAll(allowedResources)
  }
  return outstandingResources
}

return this
