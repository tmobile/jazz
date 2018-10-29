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

import { browser, element, by, protractor, $} from 'protractor';
import { Jazz } from '../page-objects/jazzservices.po';
import { CONFIGURATIONS } from '../../src/config/configuration';
import { Timeouts } from 'selenium-webdriver';
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
      function createservice(servicename)
      {
        jazzServices_po.getServiceName().sendKeys(servicename);
        jazzServices_po.getNameSpace().sendKeys('jazztest');
        jazzServices_po.getServiceDescription().sendKeys('Testing');
      }
      function serviceapprover()
      {
        browser.driver.sleep(5000);
        jazzServices_po.getSubmit().click();
        jazzServices_po.getDone().click();
      }
  it('Create API Service', () => {
        browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
        browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
        winhandle = browser.getWindowHandle();
        jazzServices_po.getCreateService().click();
        servicename='servicename' + Date.now();
        createservice(servicename);
        serviceapprover();
        browser.driver.sleep(15000);
        expect(jazzServices_po.getAPIServiceName().getText()).toEqual(servicename);
        expect(jazzServices_po.getAPIType().getText()).toEqual('api');
        expect(jazzServices_po.getAPIStatus().getText()).toEqual('creation started');
    });
    it('Create Lamda Service', () => {
        browser.driver.switchTo().activeElement();
        browser.driver.sleep(5000);
        browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
        browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
        jazzServices_po.getCreateService().click();
        browser.driver.switchTo().activeElement();
        browser.driver.sleep(5000);
        jazzServices_po.getLambda().click();
        servicename='servicename' + Date.now();
        createservice(servicename);
        jazzServices_po.getEventScheduleFixedRate().click();
        serviceapprover();
        browser.driver.sleep(15000);
        expect(jazzServices_po.getFunctionServiceName().getText()).toEqual(servicename);
        expect(jazzServices_po.getFunctionType().getText()).toEqual('function');
        expect(jazzServices_po.getFunctionStatus().getText()).toEqual('creation started');
  });
it('Create Website Service', () => {
        browser.driver.switchTo().activeElement();
        browser.driver.sleep(5000);
        browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
        browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
        jazzServices_po.getCreateService().click();
        browser.driver.switchTo().activeElement();
        browser.driver.sleep(5000);
        jazzServices_po.getWebsite().click();
        servicename='servicename' + Date.now();
        createservice(servicename);
        serviceapprover();
        browser.driver.sleep(15000);
        expect(jazzServices_po.getWebsiteServiceName().getText()).toEqual(servicename);
        expect(jazzServices_po.getWebsiteType().getText()).toEqual('website');
        expect(jazzServices_po.getWebsiteStatus().getText()).toEqual('creation started');
  });
 it('Verify API Service Page Title', () => {
       browser.wait(EC.visibilityOf(jazzServices_po.getAPIServiceName()), timeOutHigh);
       browser.wait(EC.elementToBeClickable(jazzServices_po.getAPIServiceName()), timeOutHigh);
       jazzServices_po.getAPIServiceName().click();
       browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
       browser.sleep(45000);
       browser.refresh();
       browser.driver.switchTo().activeElement();
       jazzServices_po.getRefresh().click();
       browser.sleep(30000);
  });
  it('Verify API Prod Service', () => {
      browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
      jazzServices_po.getProdName().click();
  });   
  it('Verify API Asset Service', () => {
      browser.wait(EC.visibilityOf(jazzServices_po.getProdHeader()), timeOutHigh);
      browser.wait(EC.visibilityOf(jazzServices_po.getRefresh()), timeOutHigh);
      browser.driver.switchTo().activeElement();
      browser.sleep(15000);
      jazzServices_po.getRefresh().click();
      browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
      jazzServices_po.getRefresh().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getAsset()), timeOutHigh);
      jazzServices_po.getAsset().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getAssetHeader()), timeOutHigh);
      browser.sleep(4000);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getServiceFromAsset()), timeOutHigh);
      jazzServices_po.getServiceFromAsset().click();
  });
  it('Verify lamda function Page Title', () => {
      browser.wait(EC.visibilityOf(jazzServices_po.getAPIServiceName()), timeOutHigh);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getAPIServiceName()), timeOutHigh);
      jazzServices_po.getLamdaName().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
      browser.sleep(45000);
      browser.refresh();
      browser.driver.switchTo().activeElement();
      jazzServices_po.getRefresh().click();
      browser.sleep(40000);
      browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
      jazzServices_po.getProdName().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getProdHeader()), timeOutHigh);
      browser.wait(EC.visibilityOf(jazzServices_po.getRefresh()), timeOutHigh);
      browser.driver.switchTo().activeElement();
      browser.sleep(15000);
      jazzServices_po.getRefresh().click();
      browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
      jazzServices_po.getRefresh().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getAsset()), timeOutHigh);
      jazzServices_po.getAsset().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getAssetHeader()), timeOutHigh);
      browser.sleep(4000);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getServiceFromAsset()), timeOutHigh);
      jazzServices_po.getServiceFromAsset().click();
  });
it('Verify Website Page Title', () => {
      browser.wait(EC.visibilityOf(jazzServices_po.getAPIServiceName()), timeOutHigh);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getAPIServiceName()), timeOutHigh);
      jazzServices_po.getWebsiteName().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
      browser.sleep(45000);
      browser.refresh();
      browser.driver.switchTo().activeElement();
      jazzServices_po.getRefresh().click();
      browser.sleep(30000);
      browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
      jazzServices_po.getProdName().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getProdHeader()), timeOutHigh);
      browser.wait(EC.visibilityOf(jazzServices_po.getRefresh()), timeOutHigh);
      browser.driver.switchTo().activeElement();
      browser.sleep(15000);
      jazzServices_po.getRefresh().click();
      browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
      jazzServices_po.getRefresh().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getAsset()), timeOutHigh);
      jazzServices_po.getAsset().click();
      browser.wait(EC.visibilityOf(jazzServices_po.getAssetHeader()), timeOutHigh);
      browser.sleep(4000);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getServiceFromAsset()), timeOutHigh);
      jazzServices_po.getServiceFromAsset().click();
    
  });
});




