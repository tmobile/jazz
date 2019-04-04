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

  const EC = protractor.ExpectedConditions;
  let winhandle;
  let servicename;
  let test;

  beforeAll(() => {
    jazzServices_po = new Jazz();

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

  function refreshbutton(ele, t) {
    browser.manage().timeouts().implicitlyWait(0);
//     if (browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), fivek))
//     {
//       return false;
//     }
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
    }, 120 * 1000);
  }


  it('Create API Service', function () {
    browser.driver.sleep(fivek);
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
    browser.driver.sleep(fifteenk);
    //Assert-Verifying the created service,Type and Status of the API
    expect(jazzServices_po.getService(servicename).getText()).toEqual(servicename);
    fluentwaittry(jazzServices_po.getAPIType(servicename), tenk);
    expect(jazzServices_po.getAPIType(servicename).getText()).toEqual('api');
    expect(jazzServices_po.getAPIStatus(servicename).getText()).toEqual('creation started');
    waitforservice(jazzServices_po.serviceStatus(servicename), sixtyk);
    expect(jazzServices_po.getAPIStatus(servicename).getText()).toEqual('active');
    console.log("service created");
  });

  it('Verify API Service and Navigation', () => {
    console.log("navigation started");
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
    fluentwaittry(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
    refreshbutton(jazzServices_po.getProdHeader(), fivek);
    //Verifying the browser id at the Deployment Tab
    expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
    browser.driver.switchTo().activeElement();
    console.log("navigation done");
  });

  it('Verify METRICS Navigation for API', () => {
    console.log("metrics navigation started");
    browser.driver.sleep(twok);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
    browser.driver.sleep(twok);
    browser.driver.switchTo().activeElement();
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    // // Navigation to services
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    // //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    fluentwaittry(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getProdHeader(), fivek);
    browser.driver.switchTo().activeElement();
    refreshbutton(jazzServices_po.getMetrices(), tenk);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    refreshbutton(jazzServices_po.getDeploymentStatus(), tenk);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    browser.wait(EC.visibilityOf(jazzServices_po.getTestAPI()), timeOutHigh);
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
        //refreshbutton(jazzServices_po.getXXError(), tenk);
        //jazzServices_po.getXXError().click();
        // jazzServices_po.getXXErrorFive().click();
        // browser.wait(EC.visibilityOf(jazzServices_po.getCacheHitCount()), timeOutHigh);
        // jazzServices_po.getCacheHitCount().click();
        // browser.wait(EC.visibilityOf(jazzServices_po.getCacheMissCount()), timeOutHigh);
        // jazzServices_po.getCacheMissCount().click();
        // browser.wait(EC.visibilityOf(jazzServices_po.getCount()), timeOutHigh);
        // jazzServices_po.getCount().click();
        // browser.wait(EC.visibilityOf(jazzServices_po.getIntegrationLatency()), timeOutHigh);
        // jazzServices_po.getIntegrationLatency().click();
        // browser.wait(EC.visibilityOf(jazzServices_po.getLatency()), timeOutHigh);
        // jazzServices_po.getLatency().click();
      });
    });
    console.log("metrics navigation done");
  });

  it('Verify API Deployments', () => {
    browser.driver.sleep(twok);
    refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatusVerify(), fivek);
    //Verifying the Deployment status
    expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
  });

  it('Verify API Asset', () => {
    browser.driver.sleep(twok);
    refreshbutton(jazzServices_po.getAsset(), fivek);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), fivek);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
    //refreshbutton(jazzServices_po.getAssetHeader(), fivek);
  });

  it('Verify API Logs', () => {
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
    browser.refresh();
    browser.sleep(fivek);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
  });

  it('Verify METRICS COUNT for API', () => {
    console.log("metrics count started");
    browser.driver.sleep(twok);
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    fluentwaittry(jazzServices_po.getProdName(), fivek);
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
  });
});

