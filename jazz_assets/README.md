The Core API service for assets data.
Provides an API for getting assets details of services or resources provisioned in AWS Cloud. The api fetches, creates and updates assets data for the specific service, domain, provider and provider id parameters. The lambda function would fetch, create and update asset data for the assets of a particular service name.

Request format in JSON
A simple request method for GET, PUT and POST is given below.

1. To get asset details :-
API endpoint : https://dev-cloud-api.corporate.t-mobile.com/api/platform/assets/ba97fb9e-4bb1-11e7-8518-520f5fa65757

2. To update the asset :-
API endpoint: https://dev-cloud-api.corporate.t-mobile.com/api/platform/assets/ba97fb9e-4bb1-11e7-8518-520f5fa65757

input:-
{"status": "active"}

3. To search for asset
API endpoint: https://dev-cloud-api.corporate.t-mobile.com/api/platform/assets/search

input:-
{"status": "active"}

4. To create an asset

API endpoint: https://dev-cloud-api.corporate.t-mobile.com/api/platform/assets

input:-
{ "domain": "platform", "service": "test-assets-6", "provider":"aws", "provider_id":"arn:aws:lambda:us-west-2:302890901340:function:platform_test-assets-dev-6"}
