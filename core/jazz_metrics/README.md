

The Core API service for metrics data.
Provides an API for getting metrics details of services or resources provisioned in AWS Cloud. The api pulls aws cloudwatch metrics data for the specific service and asset parameters. The lambda function would communicate with the aws cloudwatch via AWS Cloudwatch apis and pull relevant data based on the filter criteria.

Request format in JSON
A simple request payload format is given below. The request below will pull the metrics data for applications provided for the period specified for the given start date & end date.

Sample Input: {
   "domain": "jazztest",
   "service": "get-monitoring-data",
   "environment": "prod",
   "end_time": "2017-06-27T06:56:00.000Z",
   "start_time": "2017-06-27T05:55:00.000Z",
   "interval":"300",
   "assets": [{
       "type": "AWS/Lambda",
       "asset_name": "jazztest_get-monitoring-data-prod",
       "statistics": "Average"
   },
   {
       "type": "AWS/Lambda",
       "asset_name": "jazztest_get-monitoring-data-prod",
       "statistics": "Sum"
   },
​  ​{
       "type": "AWS/ApiGateway",
       "asset_name": ​"​a-test_test-cron-service-prod",
       "statistics": "Average"
   }]
}

Sample Output: {
  "data": {
    "domain": "jazztest",
    "service": "get-monitoring-data",
    "environment": "prod",
    "end_time": "2017-06-27T06:56:00.000Z",
    "start_time": "2017-06-27T05:55:00.000Z",
    "interval": "300",
    "metrics": [
      {
        "type": "AWS/ApiGateway",
        "asset_name": "a-test_test-cron-service-prod",
        "statistics": "Average",
        "metrics": [
          {
            "metric_name": "Invocations",// data points for "metric-name" Invocations for "type" APIGateway "asset-name" a-test_test-cron-service-prod
            "datapoints": []
          },
       ..............
        ]
      },
      {
        "type": "AWS/Lambda",
        "asset_name": "jazztest_get-monitoring-data-prod",
        "statistics": "Average",
        "metrics": [
          {
            "metric_name": "4XXError",
            "datapoints": []
          },
       ..............
        ]
      },
    {
        "type": "AWS/Lambda",
        "asset_name": "jazztest_get-monitoring-data-prod",
        "statistics": "Sum",
        "metrics": [
          {
            "metric_name": "4XXError",
            "datapoints": []
          } ,
       ..............

        ]
      }
    ]
  },
  "input": {
    "domain": "jazztest",
    "service": "get-monitoring-data",
    "environment": "prod",
    "end_time": "2017-06-27T06:56:00.000Z",
    "start_time": "2017-06-27T05:55:00.000Z",
    "interval": "300",
    "assets": [
      {
        "type": "AWS/Lambda",
        "asset_name": "jazztest-prod",
        "statistics": "Average"
      },
      {
        "type": "AWS/ApiGateway",
        "asset_name": "a-test_test-cron-service-prod",
        "statistics": "Average"
      }
    ]
  }
}