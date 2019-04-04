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

  it('Create Lambda Service', () => {
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(fivek);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
    jazzServices_po.getCreateService().click();
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(fivek);
    //Creating the Lambda
    jazzServices_po.getLambda().click();
    var min = 11;
    var max = 99;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'servicename' + randomNum;
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
  });

  it('Verify Function', () => {
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

  it('Verify METRICS Navigation for Lambda', () => {
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
  });

  it('Verify Lambda Deployments', () => {
    refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
    jazzServices_po.getDeploymentStatus().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getDeploymentStatusVerify(), fivek);
    //Verifying the Deployment status
    expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
  });

  it('Verify Lambda Asset', () => {
    refreshbutton(jazzServices_po.getAsset(), fivek);
    //To get the Asset Tab
    jazzServices_po.getAsset().click();
    waitForSpinnerDisappear();
    refreshbutton(jazzServices_po.getAssetStatusVerify(), fivek);
    //Verifying the Assets are ACTIVE
    expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
    refreshbutton(jazzServices_po.getAssetHeader(), fivek);
    refreshbutton(jazzServices_po.getServiceFromAsset(), fivek);
  });

  it('Verify Lambda Logs', () => {
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
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getServiceFromAsset(), fivek);
    jazzServices_po.getServiceFromAsset().click();
  });


  it('Verify METRICS COUNT for Lambda', () => {
    browser.sleep(twok);
    fluentwaittry(jazzServices_po.getService(servicename), fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
    fluentwaittry(jazzServices_po.getProdName(), fivek);
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
  });
});

