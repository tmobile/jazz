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
import { Comman } from '../comman/commantest';

const twok = 2000;
const fivek = 5000;
const tenk = 10000;
const fifteenk = 15000;
const twentyk = 20000;
const thirtyk = 30000;
const sixtyk = 60000;

const timeOutHigh = 180000;
const emailId = CONFIGURATIONS.optional.general.e2e.EMAIL_ID;
const config = CONFIGURATIONS.optional.general.e2e;

describe('Overview', () => {
  let jazzServices_po: Jazz;
  let commanUtils: Comman;

  const EC = protractor.ExpectedConditions;
  let winhandle;
  let servicename;
  let test;

  beforeAll(() => {
    jazzServices_po = new Jazz();
    commanUtils = new Comman();
  });

  function createservice(servicename) {
    jazzServices_po.getServiceName().sendKeys(servicename);
    jazzServices_po.getNameSpace().sendKeys('jazztest');
    jazzServices_po.getServiceDescription().sendKeys('Testing');
  }

  function serviceapprover() {
    browser.driver.sleep(fivek);
    jazzServices_po.getSubmit().click();
    fluentwaittry(jazzServices_po.getDone(), tenk);
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
      return ele.isPresent()
        .then(
          function (text) {
            return text;

          },
          function (error) {
            browser.refresh();
            return error;
          });
    }, 180 * 1000);
  }

  function waitforservice(ele, t) {
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
    if (!browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), fivek))
    {
      return false;
    }
    browser.wait(function () {
      browser.sleep(t);
      return ele.isPresent()
        .then(
          function (text) {
            return text;
          },
          function (error) {
            jazzServices_po.getRefresh().click();
            return false;
          });
    }, 120 * 1000);
  }

  function elementPresent(elm, t) {
    browser.manage().timeouts().implicitlyWait(0);
    browser.wait(function () {
      browser.sleep(t);
      return elm.isPresent()
        .then(
          function (text) {
            return text;
          },
          function (error) {
            browser.refresh();
            console
          });
    }, 60 * 1000);
  }

  it('Create Lambda Service', () => {
    try{
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(fivek);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
    jazzServices_po.getCreateService().click();
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(fivek);
    //Creating the Lambda
    jazzServices_po.getLambda().click();
    var min = 111;
    var max = 999;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'service' + randomNum;
    createservice(servicename);
    jazzServices_po.getEventScheduleFixedRate().click();
    serviceapprover();
    browser.driver.sleep(fifteenk);
    //Verifying the Lambda is correct
    expect(jazzServices_po.getService(servicename).getText()).toEqual(servicename);
    expect(jazzServices_po.getFunctionType(servicename).getText()).toEqual('function');
    expect(jazzServices_po.getFunctionStatus(servicename).getText()).toEqual('creation started');
    waitforservice(jazzServices_po.serviceStatus(servicename), sixtyk);
    expect(jazzServices_po.getFunctionStatus(servicename).getText()).toEqual('active');
    }catch( err ){
      console.log(err);
      console.log("Service is not created");
    }

  });

  it('Verify Function', () => {
    try{
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getOverviewStatus(), fivek);
    expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
    //To get the corresponding environment[Prod]
    elementPresent(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
    refreshbutton(jazzServices_po.getProdHeader(), fivek);
    //Verifying the browser id at the Deployment Tab
    expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
    browser.driver.switchTo().activeElement();
    }catch( err ){
      console.log(err);
      fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
      jazzServices_po.getServiceFromAsset().click();
      elementPresent(jazzServices_po.getProdName(), fivek);
      jazzServices_po.getProdName().click();
      waitForSpinnerDisappear();
    }
  
  });

  it('Verify METRICS Navigation for Lambda', () => {
    try{
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
    browser.sleep(twok);
    browser.driver.switchTo().activeElement();
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    // // Navigation to services
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    // //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    elementPresent(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getProdHeader(), fivek);
    browser.driver.switchTo().activeElement();
    refreshbutton(jazzServices_po.getMetrices(), fivek);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    fluentwaittry(jazzServices_po.getTestFunction(), fivek);
    expect(jazzServices_po.getTestFunction().getText()).toEqual('TEST FUNCTION');
    jazzServices_po.getTestFunction().click();
    browser.wait(EC.visibilityOf(jazzServices_po.getTestArea()), timeOutHigh);
    jazzServices_po.getTestArea().sendKeys('{');
    jazzServices_po.getTestArea().sendKeys(' ');
    jazzServices_po.getTestArea().sendKeys('}');
    browser.wait(EC.visibilityOf(jazzServices_po.getTestButton()), timeOutHigh);
    jazzServices_po.getTestButton().click();
    browser.driver.sleep(fivek);
    //expect(jazzServices_po.testSuccessMessage().getText()).toEqual('Function got triggered successfully');
    browser.wait(EC.visibilityOf(jazzServices_po.getClose()), timeOutHigh);
    jazzServices_po.getClose().click();
    refreshbutton(jazzServices_po.getMetrices(), fivek);
    jazzServices_po.getMetrices().click();
    waitForSpinnerDisappear();
  }catch( err ){
    console.log(err);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
    elementPresent(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
  }
  });

  it('Verify Lambda Deployments', () => {
    try{
      commanUtils.verfiyDelpoyment();
    }catch( err ){
      console.log(err);
      
    }
  });

  it('Verify Lambda Asset', () => {
    try{
      commanUtils.verfiyAsset();
    }catch( err ){
      console.log(err);
      
    }
  });

  it('Verify Lambda Logs', () => {
    try{
      commanUtils.verfiyLogs();
    }catch( err ){
      console.log(err);
      browser.refresh();
      browser.sleep(fivek);
      fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
      jazzServices_po.getServiceFromAsset().click();
    }
  });


  it('Verify METRICS COUNT for Lambda', () => {
    try{
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    elementPresent(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getMetrices(), fivek);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getMetricesCount(), fivek);
    expect(jazzServices_po.getMetricesCount().getText()).not.toEqual('-');
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
  }catch( err ){
    if(jazzServices_po.getServiceFromAsset())
    {
      jazzServices_po.getServiceFromAsset().click();
      console.log(err);
    }
    else{
      console.log(err);
    }
  }
  });

  it('Identifying Environment and Navigation for Lambda', () => {
    try{
    browser.driver.sleep(twok);
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    browser.wait(EC.visibilityOf(jazzServices_po.getRepository()), timeOutHigh);
    jazzServices_po.getRepository().click();
    browser.sleep(fivek);
    }catch( err ) {
      console.log(err);
    }
  });
  it('Create the Test Branch for Lambda', () => {
    try{
    browser.getAllWindowHandles().then(function (handles) {
      browser.sleep(twok);
      var min = 11;
      var max = 99;
      var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      test = 'test' + randomNum;
      browser.switchTo().window(handles[1]).then(function () {
      browser.sleep(tenk);
      browser.getTitle().then(function (webpagetitle) {
          if (webpagetitle === 'Sign in · GitLab') {
            expect(webpagetitle).toEqual('Sign in · GitLab');
            jazzServices_po.gitUsername().sendKeys(config.SCM_USERNAME);
            jazzServices_po.gitPassword().sendKeys(config.SCM_PASSWORD);
            jazzServices_po.gitLogin().click();
            browser.wait(EC.visibilityOf(jazzServices_po.drpGitBranchType()), timeOutHigh);
            jazzServices_po.drpGitBranchType().click();
            jazzServices_po.selectGitBranchType().click();
            jazzServices_po.gitBranchName().sendKeys(test);
            browser.wait(EC.elementToBeClickable(jazzServices_po.btnGitCreateBranch()), timeOutHigh);
            jazzServices_po.btnGitCreateBranch().click();
            browser.sleep(twok);
            browser.navigate().refresh();
            browser.sleep(twok);
            jazzServices_po.getGitLogoutIcon().click();
            jazzServices_po.getGitLogout().click();
            browser.close();
          }
          else {
            expect(webpagetitle).not.toEqual('Sign in · GitLab');
            jazzServices_po.bitUsername().sendKeys(config.SCM_USERNAME);
            jazzServices_po.bitPassword().sendKeys(config.SCM_PASSWORD);
            jazzServices_po.bitLogin().click();
            browser.wait(EC.visibilityOf(jazzServices_po.createBranch()), timeOutHigh);
            jazzServices_po.createBranch().click();
            jazzServices_po.drp_BranchType().click();
            jazzServices_po.select_BranchType().click();
            browser.sleep(twok);
            jazzServices_po.branchName().sendKeys(test);
            browser.wait(EC.elementToBeClickable(jazzServices_po.btn_CreateBranch()), timeOutHigh);
            jazzServices_po.btn_CreateBranch().click();
            browser.sleep(tenk);
            browser.navigate().refresh();
            browser.sleep(twok);
            jazzServices_po.getBitLogoutIcon().click();
            jazzServices_po.getBitLogout().click();
            browser.close();
          }
        });
      });

      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(twok);
        waitforservice(jazzServices_po.activeTestBranch(), fifteenk);
        jazzServices_po.activeTestBranch().click().
        then(null, function(err){
          console.log("the error occurred is : "+ err.name);
        });
        waitForSpinnerDisappear();
        browser.sleep(fivek);
      });
    });
  }catch( err ) {
    console.log(err);
  }
  });
  it('Verify METRICS Navigation for Lambda for Test Branch', () => {
    try{
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getTestFunction(), fifteenk);
    expect(jazzServices_po.getTestFunction().getText()).toEqual('TEST FUNCTION');
    jazzServices_po.getTestFunction().click();
    browser.wait(EC.visibilityOf(jazzServices_po.getTestArea()), timeOutHigh);
    jazzServices_po.getTestArea().sendKeys('{');
    jazzServices_po.getTestArea().sendKeys(' ');
    jazzServices_po.getTestArea().sendKeys('}');
    browser.wait(EC.visibilityOf(jazzServices_po.getTestButton()), timeOutHigh);
    jazzServices_po.getTestButton().click();
    browser.driver.sleep(fivek);
    expect(jazzServices_po.testSuccessMessage().getText()).toEqual('Function got triggered successfully');
    browser.wait(EC.visibilityOf(jazzServices_po.getClose()), timeOutHigh);
    jazzServices_po.getClose().click();
    refreshbutton(jazzServices_po.getMetrices(), fivek);
    jazzServices_po.getMetrices().click();
    waitForSpinnerDisappear();
    }catch( err ) {
      console.log(err);
    }
  });

  it('Verify Lambda Deployments for Test Branch', () => {
    try{
    refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatusVerify(), fivek);
    //Verifying the Deployment status
    expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
    }catch( err ) {
      console.log(err);
    }
  });

  it('Verify Lambda Asset for Test Branch', () => {
    try{
    refreshbutton(jazzServices_po.getAsset(), fivek);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), fivek);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
    refreshbutton(jazzServices_po.getAssetHeader(), fivek);
    refreshbutton(jazzServices_po.getServiceFromAsset(), fivek);
    }catch( err ) {
      console.log(err);
    }
  });

  it('Verify Lambda Logs for Test Branch', () => {
    try{
    refreshbutton(jazzServices_po.getLogs(), fivek);
    jazzServices_po.getLogs().click();
    refreshbutton(jazzServices_po.getFilterIcon(), fivek);
    browser.driver.switchTo().activeElement();
    jazzServices_po.getFilterIcon().click();
    refreshbutton(jazzServices_po.getDropDown(), fivek);
    jazzServices_po.getDropDown().click();
    jazzServices_po.getDay().click();
    browser.sleep(twok);
    jazzServices_po.getDropDown().click();
    jazzServices_po.getWeek().click();
    browser.sleep(twok);
    expect(jazzServices_po.getWeekVerify().getText()).toEqual('WEEK');
    jazzServices_po.getDropDown().click();
    jazzServices_po.getMonth().click();
    browser.sleep(twok);
    expect(jazzServices_po.getMonthVerify().getText()).toEqual('MONTH');
    jazzServices_po.getDropDown().click();
    jazzServices_po.getYear().click();
    expect(jazzServices_po.getYearVerify().getText()).toEqual('YEAR');
    }catch( err ) {
      console.log(err);
    }
  });
  it('Verify METRICS COUNT for Lambda in Test Branch', () => {
    try{
    browser.sleep(twok);
    refreshbutton(jazzServices_po.getMetrices(), fivek);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getMetricesCount(), fivek);
    expect(jazzServices_po.getMetricesCount().getText()).not.toEqual('-');
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
  }catch( err ){
    if(jazzServices_po.getServiceFromAsset())
    {
      jazzServices_po.getServiceFromAsset().click();
      console.log(err);
    }
    else{
      console.log(err);
      jazzServices_po.getServiceFromAsset().click();
    }
  }
  });
});

