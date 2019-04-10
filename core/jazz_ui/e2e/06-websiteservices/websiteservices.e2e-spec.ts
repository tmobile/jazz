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
import { Comman } from '../common/commontest';

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
    commanUtils.fluentwaittry(jazzServices_po.getDone(), tenk);
    jazzServices_po.getDone().click();
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
      commanUtils.waitforservice(jazzServices_po.serviceStatus(servicename), sixtyk);
      expect(jazzServices_po.getWebsiteStatus(servicename).getText()).toEqual('active');
  });

  it('Verify Webpage Title', () => {
      commanUtils.fluentwaittry(jazzServices_po.getService(servicename), fivek);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
      //To Navigate to the particular service and verifying the Page
      jazzServices_po.getService(servicename).click();
      commanUtils.fluentwaittry(jazzServices_po.getOverviewStatus(), fivek);
      expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
      commanUtils.fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
      browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
      //To get the corresponding environment[Prod]
      commanUtils.fluentwaittry(jazzServices_po.getProdName(), fivek);
      jazzServices_po.getProdName().click();
      commanUtils.waitForSpinnerDisappear();
      commanUtils.refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
      commanUtils.refreshbutton(jazzServices_po.getProdHeader(), fivek);
      //Verifying the browser id at the Deployment Tab
      expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
      browser.driver.switchTo().activeElement();
  });

  it('Verify METRICS Navigation for Website', () => {
      commanUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), fivek);
      jazzServices_po.getServiceHomePage().click();
      browser.sleep(twok);
      browser.driver.switchTo().activeElement();
      commanUtils.fluentwaittry(jazzServices_po.getService(servicename), fivek);
      // // Navigation to services
      browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
      // //To Navigate to the particular service and verifying the Page
      jazzServices_po.getService(servicename).click();
      commanUtils.fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
      commanUtils.fluentwaittry(jazzServices_po.getProdName(), fivek);
      jazzServices_po.getProdName().click();
      commanUtils.waitForSpinnerDisappear();
      commanUtils.refreshbutton(jazzServices_po.getProdHeader(), fivek);
      browser.driver.switchTo().activeElement();
      commanUtils.refreshbutton(jazzServices_po.getMetrices(), fivek);
      jazzServices_po.getMetrices().click();
      commanUtils.waitForMetricsSpinner();
      commanUtils.refreshbutton(jazzServices_po.getDeploymentStatus(), fivek);
      jazzServices_po.getDeploymentStatus().click();
      commanUtils.waitForSpinnerDisappear();
      commanUtils.fluentwaittry(jazzServices_po.goToFunction(), fivek);
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
          commanUtils.refreshbutton(jazzServices_po.getMetrices(), fivek);
          jazzServices_po.getMetrices().click();
          commanUtils.waitForSpinnerDisappear();
        });
      });
  });


  it('Verify Website Deployments', () => {
      commanUtils.verfiyDelpoyment();
  });

  it('Verify Wesbsite Asset', () => {
      commanUtils.verfiyAsset();
      commanUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), fivek);
      jazzServices_po.getServiceHomePage().click();
  });


  it('Verify METRICS COUNT for Website', () => {
      browser.sleep(twok);
      commanUtils.fluentwaittry(jazzServices_po.getService(servicename), fivek);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
      //To Navigate to the particular service and verifying the Page
      jazzServices_po.getService(servicename).click();
      commanUtils.fluentwaittry(jazzServices_po.getServiceNameHeader(), fivek);
      commanUtils.fluentwaittry(jazzServices_po.getProdName(), fivek);
      jazzServices_po.getProdName().click();
      commanUtils.waitForSpinnerDisappear();
      commanUtils.fluentwaittry(jazzServices_po.getMetrices(), fivek);
      jazzServices_po.getMetrices().click();
      commanUtils.waitForMetricsSpinner();
      // As go to website page is not reachable so it is not generating any value so commenting the below steps for now.
      //commanUtils.refreshbutton(jazzServices_po.getMetricesRequestCount(),fivek);
      //expect(jazzServices_po.getMetricesRequestCount().getText()).toEqual('10');  
      browser.sleep(twok);
      commanUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), fivek);
      jazzServices_po.getServiceHomePage().click();
  });

  it('Identifying Environment and Navigation for Website', () => {
      browser.driver.sleep(twok);
      commanUtils.fluentwaittry(jazzServices_po.getService(servicename), fivek);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), timeOutHigh);
      //To Navigate to the particular service and verifying the Page
      jazzServices_po.getService(servicename).click();
      browser.wait(EC.visibilityOf(jazzServices_po.getRepository()), timeOutHigh);
      jazzServices_po.getRepository().click();
      browser.sleep(fivek);

  });
  it('Create the Test Branch for Website', () => {
      browser.getAllWindowHandles().then(function (handles) {
        browser.sleep(tenk);
        var min = 11;
        var max = 99;
        var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
        test = 'test' + randomNum;
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
              browser.sleep(twok);
              jazzServices_po.gitBranchName().sendKeys(test);
              browser.wait(EC.elementToBeClickable(jazzServices_po.btnGitCreateBranch()), timeOutHigh);
              jazzServices_po.btnGitCreateBranch().click();
              browser.sleep(tenk);
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
          commanUtils.waitforservice(jazzServices_po.activeTestBranch(), fifteenk);
          jazzServices_po.activeTestBranch().click().
            then(null, function (err) {
              console.log("the error occurred is : " + err.name);
            });
          commanUtils.waitForSpinnerDisappear();
          browser.driver.switchTo().activeElement();
          browser.sleep(fivek);
        });
      });

  });

  it('Verify METRICS Navigation for Website for Test Branch', () => {
      browser.sleep(twok);
      commanUtils.fluentwaittry(jazzServices_po.goToFunction(), fivek);
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
          commanUtils.refreshbutton(jazzServices_po.getMetrices(), fivek);
          jazzServices_po.getMetrices().click();
          commanUtils.waitForSpinnerDisappear();
        });
      });
  });


  it('Verify Website Deployments for Test Branch', () => {
      commanUtils.verfiyDelpoyment();
  });

  it('Verify Wesbsite Asset for Test Branch', () => {
      commanUtils.verfiyAsset();
      commanUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), fivek);
      jazzServices_po.getServiceHomePage().click();
  });

  it('Verify METRICS COUNT for Website in Test Branch', () => {
      browser.sleep(twok);
      commanUtils.fluentwaittry(jazzServices_po.getMetrices(), fivek);
      jazzServices_po.getMetrices().click();
      commanUtils.waitForMetricsSpinner();
      // As go to website page is not reachable so it is not generating any value so commenting the below steps for now.
      //commanUtils.refreshbutton(jazzServices_po.getMetricesRequestCount(),fivek);
      //expect(jazzServices_po.getMetricesRequestCount().getText()).toEqual('10');  
      browser.sleep(twok);
      commanUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), fivek);
      jazzServices_po.getServiceHomePage().click();
  });
});

