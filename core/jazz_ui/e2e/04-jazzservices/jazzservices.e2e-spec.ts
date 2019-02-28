/*
 *Copyright 2016-2017 T Mobile, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); You may not use
 * this file except in compliance with the License. A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or
 * implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { browser, element, by, protractor, $ } from 'protractor';
import { Jazz } from '../page-objects/jazzservices.po';
import { CONFIGURATIONS } from '../../src/config/configuration';
import { Timeouts, Browser } from 'selenium-webdriver';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

const timeOutHigh = 180000;
const emailId = CONFIGURATIONS.optional.general.e2e.EMAIL_ID;

describe('Overview', () => {
  let jazzServices_po: Jazz;

  const EC = protractor.ExpectedConditions;
  let winhandle;
  let servicename;

  beforeAll(() => {
    jazzServices_po = new Jazz();

  });

  function createservice(servicename) {
    jazzServices_po.getServiceName().sendKeys(servicename);
    jazzServices_po.getNameSpace().sendKeys('jazztest');
    jazzServices_po.getServiceDescription().sendKeys('Testing');
  }

  function serviceapprover() {
    browser.driver.sleep(5000);
    jazzServices_po.getSubmit().click();
    fluentwaittry(jazzServices_po.getDone(), 10000);
    jazzServices_po.getDone().click();
  }
  function waitForSpinnerDisappear() {
    browser.wait(EC.not(EC.visibilityOf(jazzServices_po.getSpinner())), 180000);
  }
  function waitForMetricsSpinner() {
    browser.wait(EC.not(EC.visibilityOf(jazzServices_po.getMetricsSpinner())), 180000);
  }
  function fluentwaittry(ele, t) {
    browser.manage().timeouts().implicitlyWait(0);
    browser.wait(function () {
      browser.sleep(t);
      return ele.isDisplayed()
        .then(
          function (text) {
            return text;

          },
          function (error) {
            browser.refresh();
            return false;
          });
    }, 240 * 1000);
  }

  function refreshbutton(ele, t) {
    browser.manage().timeouts().implicitlyWait(0);
    browser.wait(function () {
      browser.sleep(t);
      return ele.isDisplayed()
        .then(
          function (text) {
            return text;
          },
          function (error) {
            jazzServices_po.getRefresh().click();
            return false;
          });
    }, 240 * 1000);
  }

  it('Create API Service', function () {
    browser.driver.sleep(5000);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
    winhandle = browser.getWindowHandle();
    //To create Service-API
    jazzServices_po.getCreateService().click();
    var min = 111111111;
    var max = 999999999;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'servicename' + randomNum;
    createservice(servicename);
    serviceapprover();
    browser.driver.sleep(15000);
    //Assert-Verifying the created service,Type and Status of the API
    expect(jazzServices_po.getAwsServiceName().getText()).toEqual(servicename);
    expect(jazzServices_po.getAPIType().getText()).toEqual('api');
    expect(jazzServices_po.getAPIStatus().getText()).toEqual('creation started');
    fluentwaittry(jazzServices_po.serviceStatus(), 60000);
    expect(jazzServices_po.getAPIStatus().getText()).toEqual('active');
  });

  it('Verify API Service and Navigation', () => {
    browser.driver.sleep(2000);
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getOverviewStatus(), 5000);
    expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
    //To get the corresponding environment[Prod]
    fluentwaittry(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    refreshbutton(jazzServices_po.getProdHeader(), 5000);
    //Verifying the browser id at the Deployment Tab
    expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
    browser.driver.switchTo().activeElement();
  });

  it('Verify METRICS Navigation for API', () => {
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
    browser.driver.sleep(2000);
    browser.driver.switchTo().activeElement();
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    // // Navigation to services
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    // //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    refreshbutton(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getProdHeader(), 5000);
    browser.driver.switchTo().activeElement();
    refreshbutton(jazzServices_po.getMetrices(), 5000);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    fluentwaittry(jazzServices_po.getTestAPI(), 5000);
    expect(jazzServices_po.getTestAPI().getText()).toEqual('TEST API');
    browser.wait(EC.elementToBeClickable(jazzServices_po.getTestAPI()), timeOutHigh);
    jazzServices_po.getTestAPI().click();
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        browser.driver.sleep(5000);
        fluentwaittry(jazzServices_po.getAPIGET(), 15000);
        expect(jazzServices_po.getAPIGET().getText()).toEqual('GET');
        jazzServices_po.getAPIGET().click();
        fluentwaittry(jazzServices_po.getTryOut(), 10000);
        jazzServices_po.getTryOut().click();
        browser.sleep(5000);
        jazzServices_po.getStringA().sendKeys('Testing');
        jazzServices_po.getStringB().sendKeys('Jazz');
        browser.wait(EC.visibilityOf(jazzServices_po.getExecute()), timeOutHigh);
        jazzServices_po.getExecute().click();
        expect(jazzServices_po.serverResponse().getText()).toEqual('200');
        jazzServices_po.getAPIGET().click();
        browser.wait(EC.visibilityOf(jazzServices_po.getAPIPOST()), timeOutHigh);
        expect(jazzServices_po.getAPIPOST().getText()).toEqual('POST');
        jazzServices_po.getAPIPOST().click();
        browser.wait(EC.visibilityOf(jazzServices_po.getTryOut()), timeOutHigh);
        jazzServices_po.getTryOut().click();
        browser.sleep(2000);
        jazzServices_po.getExecute().click();
        browser.sleep(2000);
        expect(jazzServices_po.serverResponse().getText()).toEqual('200');
        browser.close();
      });
      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(2000);
        refreshbutton(jazzServices_po.getMetrices(), 5000);
        jazzServices_po.getMetrices().click();
        waitForMetricsSpinner();
        refreshbutton(jazzServices_po.getXXError(), 5000);
        jazzServices_po.getXXError().click();
        refreshbutton(jazzServices_po.getXXErrorFive(), 5000);
        jazzServices_po.getXXErrorFive().click();
        browser.wait(EC.visibilityOf(jazzServices_po.getCacheHitCount()), timeOutHigh);
        jazzServices_po.getCacheHitCount().click();
        browser.wait(EC.visibilityOf(jazzServices_po.getCacheMissCount()), timeOutHigh);
        jazzServices_po.getCacheMissCount().click();
        browser.wait(EC.visibilityOf(jazzServices_po.getCount()), timeOutHigh);
        jazzServices_po.getCount().click();
        browser.wait(EC.visibilityOf(jazzServices_po.getIntegrationLatency()), timeOutHigh);
        jazzServices_po.getIntegrationLatency().click();
        browser.wait(EC.visibilityOf(jazzServices_po.getLatency()), timeOutHigh);
        jazzServices_po.getLatency().click();
      });
    });
  });

  it('Verify API Deployments', () => {
    browser.driver.sleep(2000);
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatusVerify(), 5000);
    //Verifying the Deployment status
    expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
  });

  it('Verify API Asset', () => {
    browser.driver.sleep(2000);
    refreshbutton(jazzServices_po.getAsset(), 5000);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), 5000);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
    refreshbutton(jazzServices_po.getAssetHeader(), 5000);
  });

  it('Verify API Logs', () => {
    refreshbutton(jazzServices_po.getLogs(), 5000);
    jazzServices_po.getLogs().click();
    refreshbutton(jazzServices_po.getFilterIcon(), 5000);
    browser.driver.switchTo().activeElement();
    jazzServices_po.getFilterIcon().click();
    refreshbutton(jazzServices_po.getDropDown(), 5000);
    jazzServices_po.getDropDown().click();
    jazzServices_po.getDay().click();
    browser.sleep(2000);
    jazzServices_po.getDropDown().click();
    jazzServices_po.getWeek().click();
    browser.sleep(2000);
    expect(jazzServices_po.getWeekVerify().getText()).toEqual('WEEK');
    jazzServices_po.getDropDown().click();
    jazzServices_po.getMonth().click();
    browser.sleep(2000);
    expect(jazzServices_po.getMonthVerify().getText()).toEqual('MONTH');
    jazzServices_po.getDropDown().click();
    jazzServices_po.getYear().click();
    expect(jazzServices_po.getYearVerify().getText()).toEqual('YEAR');
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
  });

  it('Verify METRICS COUNT for API', () => {
    browser.driver.sleep(2000);
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    fluentwaittry(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    browser.refresh();
    fluentwaittry(jazzServices_po.getMetrices(), 10000);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getMetricesCount(), 30000);
    expect(jazzServices_po.getMetricesCount().getText()).toEqual('1');
    browser.sleep(2000);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
  });

  it('Identifying Environment and Navigation for API', () => {
    browser.wait(EC.visibilityOf(jazzServices_po.getRepository()), timeOutHigh);
    jazzServices_po.getRepository().click();
    browser.sleep(5000);

  });
  it('Verify Environment Test Branch for NodeJs', () => {
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        jazzServices_po.bitUsername().sendKeys('stackbitbucket');
        jazzServices_po.bitPassword().sendKeys('J34aZ7z');
        jazzServices_po.bitLogin().click();
        browser.wait(EC.visibilityOf(jazzServices_po.createBranch()), timeOutHigh);
        jazzServices_po.createBranch().click();
        jazzServices_po.drp_BranchType().click();
        jazzServices_po.select_BranchType().click();
        browser.sleep(2000);
        jazzServices_po.branchName().sendKeys('Test');
        browser.wait(EC.elementToBeClickable(jazzServices_po.btn_CreateBranch()), timeOutHigh);
        jazzServices_po.btn_CreateBranch().click();
        browser.sleep(15000);
        browser.navigate().refresh();
        browser.sleep(2000);
        browser.close();
      });

      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(10000);
        jazzServices_po.getRefresh().click();
        browser.wait(EC.visibilityOf(jazzServices_po.testBranch()), timeOutHigh);
        jazzServices_po.testBranch().click();
        browser.sleep(15000);
        jazzServices_po.getRefresh().click();
        browser.sleep(10000);
        jazzServices_po.getRefresh().click();
        //Verifying the browser id at the Deployment Tab
        expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
        browser.wait(EC.visibilityOf(jazzServices_po.getTestBranch()), timeOutHigh);
        browser.wait(EC.visibilityOf(jazzServices_po.getRefresh()), timeOutHigh);
        browser.driver.switchTo().activeElement();
        browser.sleep(15000);
      });
    });

  });


  it('Create Lambda Service', () => {
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(5000);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
    jazzServices_po.getCreateService().click();
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(5000);
    //Creating the Lambda
    jazzServices_po.getLambda().click();
    var min = 111111111;
    var max = 999999999;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'servicename' + randomNum;
    createservice(servicename);
    jazzServices_po.getEventScheduleFixedRate().click();
    serviceapprover();
    browser.driver.sleep(15000);
    //Verifying the Lambda is correct
    expect(jazzServices_po.getAwsServiceName().getText()).toEqual(servicename);
    expect(jazzServices_po.getFunctionType().getText()).toEqual('function');
    expect(jazzServices_po.getFunctionStatus().getText()).toEqual('creation started');
    fluentwaittry(jazzServices_po.serviceStatus(), 60000);
    expect(jazzServices_po.getFunctionStatus().getText()).toEqual('active');
  });

  it('Verify Function', () => {
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getOverviewStatus(), 5000);
    expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
    //To get the corresponding environment[Prod]
    fluentwaittry(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    refreshbutton(jazzServices_po.getProdHeader(), 5000);
    //Verifying the browser id at the Deployment Tab
    expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
    browser.driver.switchTo().activeElement();
  });

  it('Verify METRICS Navigation for Lambda', () => {
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
    browser.sleep(2000);
    browser.driver.switchTo().activeElement();
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    // // Navigation to services
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    // //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    refreshbutton(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getProdHeader(), 5000);
    browser.driver.switchTo().activeElement();
    refreshbutton(jazzServices_po.getMetrices(), 5000);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    fluentwaittry(jazzServices_po.getTestFunction(), 5000);
    expect(jazzServices_po.getTestFunction().getText()).toEqual('TEST FUNCTION');
    jazzServices_po.getTestFunction().click();
    browser.wait(EC.visibilityOf(jazzServices_po.getTestArea()), timeOutHigh);
    jazzServices_po.getTestArea().sendKeys('{');
    jazzServices_po.getTestArea().sendKeys(' ');
    jazzServices_po.getTestArea().sendKeys('}');
    browser.wait(EC.visibilityOf(jazzServices_po.getTestButton()), timeOutHigh);
    jazzServices_po.getTestButton().click();
    browser.driver.sleep(5000);
    expect(jazzServices_po.testSuccessMessage().getText()).toEqual('Function got triggered successfully');
    browser.wait(EC.visibilityOf(jazzServices_po.getClose()), timeOutHigh);
    jazzServices_po.getClose().click();
    refreshbutton(jazzServices_po.getMetrices(), 5000);
    jazzServices_po.getMetrices().click();
    waitForSpinnerDisappear();
  });

  it('Verify Lambda Deployments', () => {
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatusVerify(), 5000);
    //Verifying the Deployment status
    expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
  });

  it('Verify Lambda Asset', () => {
    refreshbutton(jazzServices_po.getAsset(), 5000);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), 5000);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
    refreshbutton(jazzServices_po.getAssetHeader(), 5000);
    refreshbutton(jazzServices_po.getServiceFromAsset(), 5000);
  });

  it('Verify Lambda Logs', () => {
    refreshbutton(jazzServices_po.getLogs(), 5000);
    jazzServices_po.getLogs().click();
    refreshbutton(jazzServices_po.getFilterIcon(), 5000);
    browser.driver.switchTo().activeElement();
    jazzServices_po.getFilterIcon().click();
    refreshbutton(jazzServices_po.getDropDown(), 5000);
    jazzServices_po.getDropDown().click();
    jazzServices_po.getDay().click();
    browser.sleep(2000);
    jazzServices_po.getDropDown().click();
    jazzServices_po.getWeek().click();
    browser.sleep(2000);
    expect(jazzServices_po.getWeekVerify().getText()).toEqual('WEEK');
    jazzServices_po.getDropDown().click();
    jazzServices_po.getMonth().click();
    browser.sleep(2000);
    expect(jazzServices_po.getMonthVerify().getText()).toEqual('MONTH');
    jazzServices_po.getDropDown().click();
    jazzServices_po.getYear().click();
    expect(jazzServices_po.getYearVerify().getText()).toEqual('YEAR');
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
  });


  it('Verify METRICS COUNT for Lambda', () => {
    browser.sleep(2000);
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    fluentwaittry(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getMetrices(), 5000);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getMetricesCount(), 5000);
    expect(jazzServices_po.getMetricesCount().getText()).not.toEqual('-');
    browser.sleep(2000);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
  });

  it('Create Website Service', () => {
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(5000);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
    jazzServices_po.getCreateService().click();
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(5000);
    //Creating Website
    jazzServices_po.getWebsite().click();
    var min = 111111111;
    var max = 999999999;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'servicename' + randomNum;
    createservice(servicename);
    serviceapprover();
    browser.driver.sleep(15000);
    //Verifying the service
    expect(jazzServices_po.getAwsServiceName().getText()).toEqual(servicename);
    expect(jazzServices_po.getWebsiteType().getText()).toEqual('website');
    expect(jazzServices_po.getWebsiteStatus().getText()).toEqual('creation started');
    fluentwaittry(jazzServices_po.serviceStatus(), 60000);
    expect(jazzServices_po.getWebsiteStatus().getText()).toEqual('active');
  });

  it('Verify Webpage Title', () => {
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getOverviewStatus(), 5000);
    expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
    //To get the corresponding environment[Prod]
    fluentwaittry(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    refreshbutton(jazzServices_po.getProdHeader(), 5000);
    //Verifying the browser id at the Deployment Tab
    expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
    browser.driver.switchTo().activeElement();
  });

  it('Verify METRICS Navigation for Website', () => {
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
    browser.sleep(2000);
    browser.driver.switchTo().activeElement();
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    // // Navigation to services
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    // //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    refreshbutton(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getProdHeader(), 5000);
    browser.driver.switchTo().activeElement();
    refreshbutton(jazzServices_po.getMetrices(), 5000);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    fluentwaittry(jazzServices_po.goToFunction(), 5000);
    expect(jazzServices_po.goToFunction().getText()).toEqual('GO TO WEBSITE');
    jazzServices_po.goToFunction().click();
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        browser.sleep(5000);
        //As go to website page is not reachable and it takes more than 10 minutes to display so commenting the below steps for now.
        //expect(jazzServices_po.websiteTemplete().getText()).toEqual('Jazz Serverless Platform Website Template');
        browser.close();
      });
      browser.switchTo().window(handles[0]).then(function () {
        refreshbutton(jazzServices_po.getMetrices(), 5000);
        jazzServices_po.getMetrices().click();
        waitForSpinnerDisappear();
      });
    });
  });


  it('Verify Website Deployments', () => {
    refreshbutton(jazzServices_po.getDeploymentStatus(), 5000);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatusVerify(), 5000);
    //Verifying the Deployment status
    expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
  });

  it('Verify Wesbsite Asset', () => {
    refreshbutton(jazzServices_po.getAsset(), 5000);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), 5000);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText().then(function (text) { return text.toLowerCase() })).toEqual('active');
    refreshbutton(jazzServices_po.getAssetHeader(), 5000);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
  });


  it('Verify METRICS COUNT for Website', () => {
    browser.sleep(2000);
    fluentwaittry(jazzServices_po.getAwsServiceName(), 5000);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getAwsServiceName().click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), 5000);
    fluentwaittry(jazzServices_po.getProdName(), 5000);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    fluentwaittry(jazzServices_po.getMetrices(), 5000);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    // As go to website page is not reachable so it is not generating any value so commenting the below steps for now.
    //refreshbutton(jazzServices_po.getMetricesRequestCount(),5000);
    //expect(jazzServices_po.getMetricesRequestCount().getText()).toEqual('10');  
    browser.sleep(2000);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), 5000);
    jazzServices_po.getServiceFromAsset().click();
  });
});




