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
import { Timeouts, Browser } from 'selenium-webdriver';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { Common } from '../common/commontest';


describe('Overview', () => {
  let jazzServices_po: Jazz;
  let commonUtils: Common;
  let flag = 1;
  const EC = protractor.ExpectedConditions;
  let winhandle;
  let servicename;
  let test;

  beforeAll(() => {
    jazzServices_po = new Jazz();
    commonUtils = new Common();
    browser.driver.sleep(Common.miniWait);
    commonUtils.Login();
  });

  beforeEach(() => {
    if (flag == 0) {
      pending();
    }
  });

  afterAll(() => {
    browser.driver.sleep(Common.miniWait);
    jazzServices_po.logoutIcon().click();
    jazzServices_po.logout().click();
  });

  function createservice(servicename) {
    jazzServices_po.getServiceName().sendKeys(servicename);
    jazzServices_po.getNameSpace().sendKeys('jazztest');
    jazzServices_po.getServiceDescription().sendKeys('Testing');
  }

  function serviceapprover() {
    browser.driver.sleep(Common.miniWait);
    jazzServices_po.getSubmit().click();
    commonUtils.fluentwaittry(jazzServices_po.getDone(), Common.shortWait);
    jazzServices_po.getDone().click();
  }

  function waitforskiptest(ele, t) {
    browser.manage().timeouts().implicitlyWait(0);
    browser.wait(function () {
      browser.sleep(t);
      return ele.isDisplayed()
        .then(
          function (text) {
            flag = 1;
            return text;
          },
          function (error) {
            browser.refresh();
            flag = 0;
            return false;
          });
    }, 240 * 1000);
  }

  it('Create Lambda Service', () => {
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(Common.miniWait);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), Common.timeOutHigh).then(null, function (err) {
      console.log(err);
      flag = 0;
      browser.refresh();
    });
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), Common.timeOutHigh);
    jazzServices_po.getCreateService().click();
    browser.driver.switchTo().activeElement();
    browser.driver.sleep(Common.miniWait);
    //Creating the Lambda
    jazzServices_po.getLambda().click();
    var min = 111;
    var max = 999;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'lambda' + randomNum;
    createservice(servicename);
    jazzServices_po.getEventScheduleFixedRate().click();
    serviceapprover();
    browser.driver.sleep(Common.mediumWait);
    //Verifying the Lambda is correct
    expect(jazzServices_po.getService(servicename).getText()).toEqual(servicename);
    expect(jazzServices_po.getFunctionType(servicename).getText()).toEqual('function');
    expect(jazzServices_po.getFunctionStatus(servicename).getText()).toEqual('creation started');
    waitforskiptest(jazzServices_po.serviceStatus(servicename), Common.xxlWait);

  });

  it('Verify Function', () => {
    commonUtils.fluentwaittry(jazzServices_po.getService(servicename), Common.miniWait);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), Common.timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    commonUtils.fluentwaittry(jazzServices_po.getOverviewStatus(), Common.miniWait);
    expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
    commonUtils.fluentwaittry(jazzServices_po.getServiceNameHeader(), Common.miniWait);
    //To get the corresponding environment[Prod]
    waitforskiptest(jazzServices_po.getProdName(), Common.xlWait);
    jazzServices_po.getProdName().click();
    commonUtils.waitForSpinnerDisappear();
    commonUtils.refreshbutton(jazzServices_po.getDeploymentStatus(), Common.miniWait);
    commonUtils.refreshbutton(jazzServices_po.getProdHeader(), Common.miniWait);
    //Verifying the browser id at the Deployment Tab
    expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
    browser.driver.switchTo().activeElement();

  });

  it('Verify METRICS Navigation for Lambda', () => {
    commonUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), Common.miniWait);
    jazzServices_po.getServiceHomePage().click();
    browser.sleep(Common.microWait);
    browser.driver.switchTo().activeElement();
    commonUtils.fluentwaittry(jazzServices_po.getService(servicename), Common.miniWait);
    // // Navigation to services
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), Common.timeOutHigh);
    // //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    commonUtils.fluentwaittry(jazzServices_po.getServiceNameHeader(), Common.miniWait);
    commonUtils.elementPresent(jazzServices_po.getProdName(), Common.shortWait);
    jazzServices_po.getProdName().click();
    commonUtils.waitForSpinnerDisappear();
    commonUtils.refreshbutton(jazzServices_po.getProdHeader(), Common.miniWait);
    browser.driver.switchTo().activeElement();
    commonUtils.refreshbutton(jazzServices_po.getMetrices(), Common.miniWait);
    jazzServices_po.getMetrices().click();
    commonUtils.waitForMetricsSpinner();
    commonUtils.refreshbutton(jazzServices_po.getDeploymentStatus(), Common.miniWait);
    jazzServices_po.getDeploymentStatus().click();
    commonUtils.waitForSpinnerDisappear();
    commonUtils.fluentwaittry(jazzServices_po.getTestFunction(), Common.miniWait);
    expect(jazzServices_po.getTestFunction().getText()).toEqual('TEST FUNCTION');
    jazzServices_po.getTestFunction().click();
    browser.wait(EC.visibilityOf(jazzServices_po.getTestArea()), Common.timeOutHigh);
    jazzServices_po.getTestArea().sendKeys('{');
    jazzServices_po.getTestArea().sendKeys(' ');
    jazzServices_po.getTestArea().sendKeys('}');
    browser.wait(EC.visibilityOf(jazzServices_po.getTestButton()), Common.timeOutHigh);
    jazzServices_po.getTestButton().click();
    browser.driver.sleep(Common.miniWait);
    browser.wait(EC.visibilityOf(jazzServices_po.getClose()), Common.timeOutHigh);
    jazzServices_po.getClose().click();
    commonUtils.refreshbutton(jazzServices_po.getMetrices(), Common.miniWait);
    jazzServices_po.getMetrices().click();
    commonUtils.waitForSpinnerDisappear();
  });

  it('Verify Lambda Deployments', () => {
    commonUtils.verifyDelpoyment();
  });

  it('Verify Lambda Asset', () => {
    commonUtils.verifyAsset();
  });

  it('Verify Lambda Logs', () => {
    commonUtils.verifyLogs();
  });


  it('Verify METRICS COUNT for Lambda', () => {
    browser.sleep(Common.microWait);
    commonUtils.refreshbutton(jazzServices_po.getMetrices(), Common.miniWait);
    jazzServices_po.getMetrices().click();
    commonUtils.waitForMetricsSpinner();
    commonUtils.refreshbutton(jazzServices_po.getMetricesCount(), Common.miniWait);
    expect(jazzServices_po.getMetricesCount().getText()).not.toEqual('-');
    browser.sleep(Common.microWait);
  });

  it('Identifying Environment and Navigation for Lambda', () => {
    browser.driver.sleep(Common.microWait);
    commonUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), Common.miniWait);
    jazzServices_po.getServiceHomePage().click();
    commonUtils.fluentwaittry(jazzServices_po.getService(servicename), Common.miniWait);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), Common.timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    browser.wait(EC.visibilityOf(jazzServices_po.getRepository()), Common.timeOutHigh);
    jazzServices_po.getRepository().click();
    browser.sleep(Common.miniWait);
  });
  it('Create the Test Branch for Lambda', () => {
    browser.getAllWindowHandles().then(function (handles) {
      browser.sleep(Common.microWait);
      var min = 11;
      var max = 99;
      var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      var test = 'TEST' + randomNum;
      browser.switchTo().window(handles[1]).then(function () {
       browser.sleep(Common.microWait);
   
       var some_name = browser.getTitle().then(function (webpagetitle) {
        if (webpagetitle === 'Sign in · GitLab') {
         expect(webpagetitle).toEqual('Sign in · GitLab');
         jazzServices_po.gitUsername().sendKeys(Common.config.SCM_USERNAME).then(null, function (err) {
          console.log("Invalid Username"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.gitPassword().sendKeys(Common.config.SCM_PASSWORD).then(null, function (err) {
          console.log("Invalid Password"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.gitLogin().click().then(null, function (err) {
          console.log("Login Button is not visible"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.drpGitBranchType().click().then(null, function (err) {
          console.log("Branch drop not is not working"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.selectGitBranchType().click().then(null, function (err) {
          console.log("Feature type is not available"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.gitBranchName().sendKeys(test).then(null, function (err) {
          console.log("Branch name text box is not visible"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.btnGitCreateBranch().click().then(null, function (err) {
          console.log("Create branch button is not working"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.getGitLogoutIcon().click().then(null, function (err) {
          console.log("Unable to locate Logout Icon"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.getGitLogout().click().then(null, function (err) {
          console.log("Unable to locate Logout link"+err.name);
          flag = 0;
          browser.sleep(Common.longWait);
          browser.close();
         });
         browser.sleep(Common.microWait);
         browser.close();
        }
        else {
         expect(webpagetitle).not.toEqual('Sign in · GitLab');
         jazzServices_po.bitUsername().sendKeys(Common.config.SCM_USERNAME).then(null, function (err) {
          console.log("Invalid Username"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.bitPassword().sendKeys(Common.config.SCM_PASSWORD).then(null, function (err) {
          console.log("Invalid Password"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.bitLogin().click().then(null, function (err) {
          console.log("Unable to locate Login button"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.createBranch().click().then(null, function (err) {
          console.log("Unable to locate create branch button"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.drp_BranchType().click().then(null, function (err) {
          console.log("Unable to locate branch type dropdown"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.select_BranchType().click().then(null, function (err) {
          console.log("Unable to locate branch type"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.branchName().sendKeys(test).then(null, function (err) {
          console.log("Unable to locate create branch textbox"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.btn_CreateBranch().click().then(null, function (err) {
          console.log("Unable to locate submit button"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.getBitLogoutIcon().click().then(null, function (err) {
          console.log("Unable to locate bitbucket logout icon"+err.name);
         });
         browser.sleep(Common.microWait);
         jazzServices_po.getBitLogout().click().then(null, function (err) {
          console.log("Unable to locate bitbucket logout button"+err.name);
          flag = 0;
          browser.sleep(Common.longWait);
          browser.close();
         });
         browser.sleep(Common.microWait);
         browser.close();
        }
       });
      });
      browser.switchTo().window(handles[0]).then(function () {
       browser.sleep(Common.microWait);
       waitforskiptest(jazzServices_po.activeTestBranch(), Common.xxlWait);
       jazzServices_po.activeTestBranch().click().
        then(null, function (err) {
         console.log("the error occurred is : " + err.name);
        });
       commonUtils.waitForSpinnerDisappear();
       browser.sleep(Common.miniWait);
      });
     });
  });
  it('Verify METRICS Navigation for Lambda for Test Branch', () => {
    browser.sleep(Common.microWait);
    commonUtils.fluentwaittry(jazzServices_po.getTestFunction(), Common.mediumWait);
    expect(jazzServices_po.getTestFunction().getText()).toEqual('TEST FUNCTION');
    jazzServices_po.getTestFunction().click();
    browser.wait(EC.visibilityOf(jazzServices_po.getTestArea()), Common.timeOutHigh);
    jazzServices_po.getTestArea().sendKeys('{');
    jazzServices_po.getTestArea().sendKeys(' ');
    jazzServices_po.getTestArea().sendKeys('}');
    browser.wait(EC.visibilityOf(jazzServices_po.getTestButton()), Common.timeOutHigh);
    jazzServices_po.getTestButton().click();
    browser.driver.sleep(Common.miniWait);
    browser.wait(EC.visibilityOf(jazzServices_po.getClose()), Common.timeOutHigh);
    jazzServices_po.getClose().click();
    commonUtils.refreshbutton(jazzServices_po.getMetrices(), Common.miniWait);
    jazzServices_po.getMetrices().click();
    commonUtils.waitForSpinnerDisappear();
  });

  it('Verify Lambda Deployments for Test Branch', () => {
    commonUtils.verifyDelpoyment();
  });

  it('Verify Lambda Asset for Test Branch', () => {
    commonUtils.verifyAsset();
  });

  it('Verify Lambda Logs for Test Branch', () => {
    commonUtils.verifyLogs();
  });
  it('Verify METRICS COUNT for Lambda in Test Branch', () => {
    browser.sleep(Common.microWait);
    commonUtils.fluentwaittry(jazzServices_po.getMetrices(), Common.mediumWait);
    jazzServices_po.getMetrices().click();
    commonUtils.waitForMetricsSpinner();
    commonUtils.refreshbutton(jazzServices_po.getMetricesCount(), Common.shortWait);
    expect(jazzServices_po.getMetricesCount().getText()).not.toEqual('-');
    browser.sleep(Common.microWait);
    commonUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), Common.miniWait);
    jazzServices_po.getServiceHomePage().click();
  });
});
