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

  it('Create Website Service', () => {
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(fivek);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
    jazzServices_po.getCreateService().click();
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(fivek);
    //Creating Website
    jazzServices_po.getWebsite().click();
    var min = 111111111;
    var max = 999999999;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'servicename' + randomNum;
    createservice(servicename);
    serviceapprover();
    browser.driver.sleep(fifteenk);
    //Verifying the service
    expect(jazzServices_po.getService(servicename).getText()).toEqual(servicename);
    expect(jazzServices_po.getWebsiteType(servicename).getText()).toEqual('website');
    expect(jazzServices_po.getWebsiteStatus(servicename).getText()).toEqual('creation started');
    waitforservice(jazzServices_po.serviceStatus(servicename), sixtyk);
    expect(jazzServices_po.getWebsiteStatus(servicename).getText()).toEqual('active');
  });

  it('Verify Webpage Title', () => {
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
  });

  it('Verify METRICS Navigation for Website', () => {
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
    fluentwaittry(jazzServices_po.getProdName(), fivek);
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
    fluentwaittry(jazzServices_po.goToFunction(), fivek);
    expect(jazzServices_po.goToFunction().getText()).toEqual('GO TO WEBSITE');
    jazzServices_po.goToFunction().click();
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        browser.sleep(fivek);
        //As go to website page is not reachable and it takes more than 10 minutes to display so commenting the below steps for now.
        //expect(jazzServices_po.websiteTemplete().getText()).toEqual('Jazz Serverless Platform Website Template');
        browser.close();
      });
      browser.switchTo().window(handles[0]).then(function () {
        refreshbutton(jazzServices_po.getMetrices(), fivek);
        jazzServices_po.getMetrices().click();
        waitForSpinnerDisappear();
      });
    });
  });


  it('Verify Website Deployments', () => {
    refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatusVerify(), fivek);
    //Verifying the Deployment status
    expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
  });

  it('Verify Wesbsite Asset', () => {
    refreshbutton(jazzServices_po.getAsset(), fivek);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), fivek);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText().then(function (text) { return text.toLowerCase() })).toEqual('active');
    refreshbutton(jazzServices_po.getAssetHeader(), fivek);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
  });


  it('Verify METRICS COUNT for Website', () => {
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    fluentwaittry(jazzServices_po.getProdName(), fivek);
    jazzServices_po.getProdName().click();
    waitForSpinnerDisappear();
    fluentwaittry(jazzServices_po.getMetrices(), fivek);
    jazzServices_po.getMetrices().click();
    waitForMetricsSpinner();
    // As go to website page is not reachable so it is not generating any value so commenting the below steps for now.
    //refreshbutton(jazzServices_po.getMetricesRequestCount(),fivek);
    //expect(jazzServices_po.getMetricesRequestCount().getText()).toEqual('10');  
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
  });
});

