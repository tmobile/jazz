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
  

  beforeAll(() => {
    jazzServices_po = new Jazz();
    commanUtils = new Comman();

  });

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

  
  it('Create API Service', function () {
    try{
      browser.driver.sleep(fivek);
      browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
      //To create Service-API
      jazzServices_po.getCreateService().click();
      var min = 111111111;
      var max = 999999999;
      var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      servicename = 'servicename' + randomNum;
      createservice(servicename);
      serviceapprover();
      browser.driver.sleep(fifteenk);
      //Assert-Verifying the created service,Type and Status of the API
      expect(jazzServices_po.getService(servicename).getText()).toEqual(servicename);
      fluentwaittry(jazzServices_po.getAPIType(servicename), tenk);
      expect(jazzServices_po.getAPIType(servicename).getText()).toEqual('api');
      expect(jazzServices_po.getAPIStatus(servicename).getText()).toEqual('creation started');
      waitforservice(jazzServices_po.serviceStatus(servicename), sixtyk);
      expect(jazzServices_po.getAPIStatus(servicename).getText()).toEqual('active');
      console.log("service created");
      
    }catch( err ){
      console.log(err);
      console.log("Servie is not created");
    }
  });

  it('Verify API Service and Navigation', () => {
    try{
      browser.driver.sleep(twok);
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
      console.log("navigation done");
    }catch( err ){
      console.log(err);
      fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
      jazzServices_po.getServiceFromAsset().click();
      elementPresent(jazzServices_po.getProdName(), fivek);
      jazzServices_po.getProdName().click();
      waitForSpinnerDisappear();
      
    }
    
  });

  it('Verify METRICS Navigation for API', () => {
    try{
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getTestAPI(), fifteenk);
    expect(jazzServices_po.getTestAPI().getText()).toEqual('TEST API');
    browser.wait(EC.elementToBeClickable(jazzServices_po.getTestAPI()), timeOutHigh);
    jazzServices_po.getTestAPI().click();
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        browser.driver.sleep(fivek);
        fluentwaittry(jazzServices_po.getAPIGET(), fifteenk);
        //browser.wait(EC.visibilityOf(jazzServices_po.getAPIGET()), timeOutHigh);
        expect(jazzServices_po.getAPIGET().getText()).toEqual('GET');
        jazzServices_po.getAPIGET().click();
        fluentwaittry(jazzServices_po.getTryOut(), tenk);
        jazzServices_po.getTryOut().click();
        browser.sleep(fivek);
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
        browser.sleep(twok);
        jazzServices_po.getExecute().click();
        browser.sleep(twok);
        expect(jazzServices_po.serverResponse().getText()).toEqual('200');
        browser.close();
      });
      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(twok);
        refreshbutton(jazzServices_po.getMetrices(), fivek);
        jazzServices_po.getMetrices().click();
        waitForMetricsSpinner();
      });
    });
  }catch( err ){
    console.log(err);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
    elementPresent(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
  }
    console.log("metrics navigation done");
  });

  it('Verify API Deployments', () => {
    try{
      commanUtils.verfiyDelpoyment();
    }catch( err ){
      console.log(err);
      
    }
    
  });

  it('Verify API Asset', () => {
    try{
      commanUtils.verfiyAsset();
    }catch( err ){
      console.log(err);
      
    }
    
  });

  it('Verify API Logs', () => {
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

  it('Verify METRICS COUNT for API', () => {
    try{
    console.log("metrics count started");
    browser.driver.sleep(twok);
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    elementPresent(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    browser.refresh();
    fluentwaittry(jazzServices_po.getMetrices(), tenk);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getMetricesCount(), thirtyk);
    expect(jazzServices_po.getMetricesCount().getText()).toEqual('1');
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
    console.log("metrics count done");
    }catch(err){
        console.log(err);
    }
  });

  it('Identifying Environment and Navigation for API', () => {
    try{
    browser.driver.sleep(twok);
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    expect(jazzServices_po.getRepo().getText()).toEqual('Repository');
    browser.wait(EC.visibilityOf(jazzServices_po.getRepository()), timeOutHigh);
    jazzServices_po.getRepository().click();
    browser.sleep(fivek);
    }catch( err ) {
      console.log(err);
    }

  });
  it('Create the Test Branch for API', () => {
    try{
    console.log("test branch creation started");
    browser.getAllWindowHandles().then(function (handles) {
    browser.sleep(twok);
    var min = 11;
    var max = 99;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    var test = 'TEST' + randomNum;
    browser.switchTo().window(handles[1]).then(function () {
    browser.sleep(twok);

      var some_name = browser.getTitle().then(function (webpagetitle) {
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
          browser.sleep(tenk);
          console.log("test branch creation done");
          //Below code is to write the text into index.js file in SCM for generating logs
          // jazzServices_po.gitIndexFile().click();
          // jazzServices_po.gitEditIndexFile().click();
          // jazzServices_po.removeLineFirst().sendKeys('Vijay');
          // jazzServices_po.gitComitChanges().click();

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
        browser.sleep(fivek);
        console.log("searching for test branch");
        waitforservice(jazzServices_po.activeTestBranch(), fifteenk);
        jazzServices_po.activeTestBranch().click();
        waitForSpinnerDisappear();
        browser.driver.switchTo().activeElement();
        browser.sleep(fivek);
      });
    });
  }catch( err ){
      console.log(err);
  }

  });

  it('Verify METRICS Navigation for API Test Branch', () => {
    try{
    refreshbutton(jazzServices_po.getMetrices(), fivek);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    fluentwaittry(jazzServices_po.getTestAPI(), tenk);
    expect(jazzServices_po.getTestAPI().getText()).toEqual('TEST API');
    browser.wait(EC.elementToBeClickable(jazzServices_po.getTestAPI()), timeOutHigh);
    jazzServices_po.getTestAPI().click();
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        browser.driver.sleep(fivek);
        fluentwaittry(jazzServices_po.getAPIGET(), fifteenk);
        expect(jazzServices_po.getAPIGET().getText()).toEqual('GET');
        jazzServices_po.getAPIGET().click();
        fluentwaittry(jazzServices_po.getTryOut(), tenk);
        jazzServices_po.getTryOut().click();
        browser.sleep(fivek);
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
        browser.sleep(twok);
        jazzServices_po.getExecute().click();
        browser.sleep(twok);
        expect(jazzServices_po.serverResponse().getText()).toEqual('200');
        browser.close();
      });
      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(twok);
        refreshbutton(jazzServices_po.getMetrices(), fivek);
        jazzServices_po.getMetrices().click();
        waitForMetricsSpinner();
        refreshbutton(jazzServices_po.getXXError(), tenk);
        jazzServices_po.getXXError().click();
        refreshbutton(jazzServices_po.getXXErrorFive(), tenk);
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
  } catch ( err ) {
    console.log(err);
  }
  });
  it('Verify API Deployments for Test Branch', () => {
    try{
    browser.driver.sleep(twok);
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

  it('Verify API Asset for Test Branch', () => {
    try{
    browser.driver.sleep(twok);
    refreshbutton(jazzServices_po.getAsset(), fivek);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), fivek);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
    refreshbutton(jazzServices_po.getAssetHeader(), fivek);
    }catch( err ) {
      console.log(err);
    }
  });

  it('Verify API Logs for Test Branch', () => {
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
    // fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    // jazzServices_po.getServiceFromAsset().click();
    }catch( err ) {
      console.log(err);
    }
  });

  it('Verify METRICS COUNT for API for Test Branch', () => {
    try{
    console.log("test branch metrics count start");
    fluentwaittry(jazzServices_po.getMetrices(), tenk);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getMetricesCount(), thirtyk);
    expect(jazzServices_po.getMetricesCount().getText()).toEqual('1');
    browser.driver.switchTo().activeElement();
    browser.refresh();
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
    console.log("test branch metrics count done");
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

