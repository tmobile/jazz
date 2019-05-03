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
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG, SSL_OP_TLS_BLOCK_PADDING_BUG } from 'constants';
import { Common } from '../common/commontest';


describe('Overview', () => {
  let jazzServices_po: Jazz;
  let commonUtils: Common;
  let found = 1;
  let flag = 1;
  const EC = protractor.ExpectedConditions;
  let winhandle;
  let servicename;

  beforeAll(() => {
    jazzServices_po = new Jazz();
    commonUtils = new Common();
  });
  beforeEach(() => {
    if (flag == 0) {
      pending();
    }
    if (found == 0) {
      commonUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), Common.tenk);
      jazzServices_po.getServiceHomePage().click();
    }
  });
  afterAll(() => {
    jazzServices_po = new Jazz();
    commonUtils = new Common();
    browser.driver.sleep(Common.fivek);
    jazzServices_po.logoutIcon().click();
    jazzServices_po.logout().click();
  });


  function createservice(servicename) {
    jazzServices_po.getServiceName().sendKeys(servicename);
    jazzServices_po.getNameSpace().sendKeys('jazztest');
    jazzServices_po.getServiceDescription().sendKeys('Testing');
  }

  function serviceapprover() {
    browser.driver.sleep(Common.fivek);
    jazzServices_po.getSubmit().click();
    jazzServices_po.getDone().click().then(null, function (err) {
      flag = 0;
    });
    commonUtils.waitForSpinnerLogin();
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

  it('Create API Service', function () {
    browser.driver.sleep(Common.fivek);
    browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), Common.timeOutHigh).then(null, function (err) {
      console.log(err);
      flag = 0;
      browser.refresh();
    });
    browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), Common.timeOutHigh);
    //To create Service-API
    jazzServices_po.getCreateService().click();
    var min = 111111111;
    var max = 999999999;
    var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    servicename = 'servicename' + randomNum;
    createservice(servicename);
    serviceapprover();
    browser.driver.sleep(Common.fifteenk);
    //Assert-Verifying the created service,Type and Status of the API
    expect(jazzServices_po.getService(servicename).getText()).toEqual(servicename);
    commonUtils.fluentwaittry(jazzServices_po.getAPIType(servicename), Common.tenk);
    expect(jazzServices_po.getAPIType(servicename).getText()).toEqual('api');
    expect(jazzServices_po.getAPIStatus(servicename).getText()).toEqual('creation started');
    waitforskiptest(jazzServices_po.serviceStatus(servicename), Common.sixtyk);
  });

  it('Verify API Service and Navigation', () => {
    browser.driver.sleep(Common.twok);
    commonUtils.fluentwaittry(jazzServices_po.getService(servicename), Common.fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), Common.timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    commonUtils.waitForSpinnerDisappear();
    commonUtils.fluentwaittry(jazzServices_po.getOverviewStatus(), Common.fivek);
    expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
    commonUtils.elementPresent(jazzServices_po.getServiceNameHeader(), Common.fivek);
    waitforskiptest(jazzServices_po.getProdName(), Common.sixtyk);
    jazzServices_po.getProdName().click();
    commonUtils.waitForSpinnerDisappear();
    commonUtils.elementPresent(jazzServices_po.getDeploymentStatus(), Common.tenk);
    //Verifying the browser id at the Deployment Tab
    expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
    browser.driver.switchTo().activeElement();
  });

  it('Verify METRICS Navigation for API', () => {
    browser.sleep(Common.twok);
    jazzServices_po.getTestAPI().click().then(null, function (err) {
      console.log("the error occurred is : " + err.name);
      expect(jazzServices_po.getTestAPI().getText()).toEqual('Failed Test API');
      browser.sleep(Common.fivek);
    });
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        browser.driver.sleep(Common.tenk);
        commonUtils.fluentwaittry(jazzServices_po.getAPIGET(), Common.fifteenk);
        jazzServices_po.getAPIGET().click().then(null, function (err) {
          console.log("Swagger Page is Failed to upload : " + err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getTryOut().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getStringA().sendKeys('Testing').then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getStringB().sendKeys('Jazz').then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getExecute().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getAPIGET().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getAPIPOST().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getTryOut().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getExecute().click().then(null, function (err) {
          console.log(err.name);
          if (jazzServices_po.SwaggerFailed()) {
            expect(jazzServices_po.SwaggerFailed().getText()).toEqual('Failed test');
          } else if (jazzServices_po.getAPIGET()) {
            expect(jazzServices_po.getAPIGET().getText()).toEqual('GETT');
          } else {
            browser.sleep(Common.twentyk);
            browser.close();
          }
        });
        browser.sleep(Common.fivek);
        browser.close();

      });
      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(Common.fivek);
        commonUtils.elementPresent(jazzServices_po.getMetrices(), Common.fivek);
        jazzServices_po.getMetrices().click();
        commonUtils.waitForMetricsSpinner();
      });
    });
  });

  it('Verify API Deployments', () => {
    commonUtils.verifyDelpoyment();
  });

  it('Verify API Asset', () => {
    commonUtils.verifyAsset();

  });

  it('Verify API Logs', () => {
    commonUtils.verifyLogs();

  });

  it('Verify METRICS COUNT for API', () => {
    browser.sleep(Common.fivek);
    commonUtils.fluentwaittry(jazzServices_po.getMetrices(), Common.tenk);
    jazzServices_po.getMetrices().click();
    commonUtils.waitForMetricsSpinner();
    browser.sleep(Common.tenk);
    commonUtils.refreshbutton(jazzServices_po.getMetricesCount(), Common.fifteenk);
    expect(jazzServices_po.getMetricesCount().getText()).toEqual('1');
    browser.sleep(Common.fivek);
    commonUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), Common.fifteenk);
    jazzServices_po.getServiceHomePage().click();
  });

  it('Identifying Environment and Navigation for API', () => {
    browser.driver.sleep(Common.twok);
    commonUtils.fluentwaittry(jazzServices_po.getService(servicename), Common.fivek);
    browser.wait(EC.elementToBeClickable(jazzServices_po.getService(servicename)), Common.timeOutHigh);
    //To Navigate to the particular service and verifying the Page
    jazzServices_po.getService(servicename).click();
    expect(jazzServices_po.getRepo().getText()).toEqual('Repository');
    browser.wait(EC.visibilityOf(jazzServices_po.getRepository()), Common.timeOutHigh);
    jazzServices_po.getRepository().click();
    browser.sleep(Common.fivek);
  });

  it('Create the Test Branch for API', () => {
    browser.getAllWindowHandles().then(function (handles) {
      browser.sleep(Common.twok);
      var min = 11;
      var max = 99;
      var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      var test = 'TEST' + randomNum;
      browser.switchTo().window(handles[1]).then(function () {
        browser.sleep(Common.twok);

        var some_name = browser.getTitle().then(function (webpagetitle) {
          if (webpagetitle === 'Sign in · GitLab') {
            expect(webpagetitle).toEqual('Sign in · GitLab');
            jazzServices_po.gitUsername().sendKeys(Common.config.SCM_USERNAME).then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.gitPassword().sendKeys(Common.config.SCM_PASSWORD).then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.gitLogin().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.drpGitBranchType().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.selectGitBranchType().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.gitBranchName().sendKeys(test).then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.btnGitCreateBranch().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.getGitLogoutIcon().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.getGitLogout().click().then(null, function (err) {
              console.log(err.name);
              flag = 0;
              browser.sleep(Common.twentyk);
              browser.close();
            });
            browser.sleep(Common.twok);
            browser.close();
          }
          else {
            expect(webpagetitle).not.toEqual('Sign in · GitLab');
            jazzServices_po.bitUsername().sendKeys(Common.config.SCM_USERNAME).then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.bitPassword().sendKeys(Common.config.SCM_PASSWORD).then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.bitLogin().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.createBranch().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.drp_BranchType().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.select_BranchType().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.branchName().sendKeys(test).then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.btn_CreateBranch().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.getBitLogoutIcon().click().then(null, function (err) {
              console.log(err.name);
            });
            browser.sleep(Common.twok);
            jazzServices_po.getBitLogout().click().then(null, function (err) {
              console.log(err.name);
              flag = 0;
              browser.sleep(Common.twentyk);
              browser.close();
            });
            browser.sleep(Common.twok);
            browser.close();
          }
        });
      });
      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(Common.twok);
        waitforskiptest(jazzServices_po.activeTestBranch(), Common.sixtyk);
        jazzServices_po.activeTestBranch().click().
          then(null, function (err) {
            console.log("the error occurred is : " + err.name);
          });
        commonUtils.waitForSpinnerDisappear();
        browser.sleep(Common.fivek);
      });
    });
  });

  it('Verify METRICS Navigation for API Test Branch', () => {
    commonUtils.fluentwaittry(jazzServices_po.getTestAPI(), Common.fifteenk);
    expect(jazzServices_po.getTestAPI().getText()).toEqual('TEST API');
    browser.wait(EC.elementToBeClickable(jazzServices_po.getTestAPI()), Common.timeOutHigh);
    jazzServices_po.getTestAPI().click();
    browser.getAllWindowHandles().then(function (handles) {
      browser.switchTo().window(handles[1]).then(function () {
        browser.driver.sleep(Common.tenk);
        commonUtils.fluentwaittry(jazzServices_po.getAPIGET(), Common.fifteenk);
        jazzServices_po.getAPIGET().click().then(null, function (err) {
          console.log("Swagger Page is Failed to upload : " + err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getTryOut().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getStringA().sendKeys('Testing').then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getStringB().sendKeys('Jazz').then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getExecute().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getAPIGET().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getAPIPOST().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getTryOut().click().then(null, function (err) {
          console.log(err.name);
        });
        browser.sleep(Common.twok);
        jazzServices_po.getExecute().click().then(null, function (err) {
          console.log(err.name);
          if (jazzServices_po.SwaggerFailed()) {
            expect(jazzServices_po.SwaggerFailed().getText()).toEqual('Failed test');
          } else if (jazzServices_po.getAPIGET()) {
            expect(jazzServices_po.getAPIGET().getText()).toEqual('GETT');
          } else {
            browser.sleep(Common.twentyk);
            browser.close();
          }
        });
        browser.sleep(Common.fivek);
        browser.close();
      });
      browser.switchTo().window(handles[0]).then(function () {
        browser.sleep(Common.fivek);
        commonUtils.elementPresent(jazzServices_po.getMetrices(), Common.fivek);
        jazzServices_po.getMetrices().click();
        commonUtils.waitForMetricsSpinner();
      });
    });
  });
  it('Verify API Deployments for Test Branch', () => {
    commonUtils.verifyDelpoyment();
  });

  it('Verify API Asset for Test Branch', () => {
    commonUtils.verifyAsset();
  });

  it('Verify API Logs for Test Branch', () => {
    commonUtils.verifyLogs();
  });

  it('Verify METRICS COUNT for API for Test Branch', () => {
    browser.driver.sleep(Common.twok);
    commonUtils.fluentwaittry(jazzServices_po.getMetrices(), Common.fifteenk);
    jazzServices_po.getMetrices().click();
    commonUtils.waitForMetricsSpinner();
    browser.sleep(Common.fivek);
    // jazzServices_po.getMetricesCount().isPresent().then(null, function(err){
    //   console.log(err.name);
    //   commonUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), Common.fivek);
    //   jazzServices_po.getServiceHomePage().click();
    // });
    commonUtils.refreshbutton(jazzServices_po.getMetricesCount(), Common.fifteenk);
    expect(jazzServices_po.getMetricesCount().getText()).toEqual('1');
    browser.sleep(Common.twok);
    commonUtils.fluentwaittry(jazzServices_po.getServiceHomePage(), Common.fivek);
    jazzServices_po.getServiceHomePage().click();
  });

});

