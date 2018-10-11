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
import { Login } from '../page-objects/login.po';
import { Jazz } from '../page-objects/jazzservices.po';
import { CONFIGURATIONS } from '../../src/config/configuration';
import { Timeouts } from 'selenium-webdriver';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';


const timeOutHigh = 2500000;
const emailId = CONFIGURATIONS.optional.general.e2e.EMAIL_ID;

describe('Overview', () => {
  let login_po: Login;
  let jazzServices_po: Jazz;
  const EC = protractor.ExpectedConditions;
  let tagging_count;
  let winhandle;
  let servicename;

  beforeAll(() => {
    login_po = new Login();
    jazzServices_po = new Jazz();
    });



      function createservice(servicename)
      {
        //servicename='servicename' + Date.now();
        jazzServices_po.getServiceName().sendKeys(servicename);
        jazzServices_po.getNameSpace().sendKeys('jazztest');
        //jazzServices_po.getApplication().sendKeys('ABC Services');
        //jazzServices_po.getApplicationClick().click();
        jazzServices_po.getServiceDescription().sendKeys('Testing');
      }
      function serviceapprover()
      {
        //jazzServices_po.getApprover().sendKeys('');
        //jazzServices_po.getApproverClick().click();
        browser.driver.sleep(5000);
        jazzServices_po.getSubmit().click();
        jazzServices_po.getDone().click();
      }
    it('Create API Service', () => {
      //For API
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
      //For Lambda
      //browser.driver.navigate().refresh();
      browser.driver.switchTo().activeElement();
      browser.driver.sleep(5000);
      browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
      browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
      jazzServices_po.getCreateService().click();
      browser.driver.switchTo().activeElement();
      browser.driver.sleep(5000);
      //jazzServices_po.getFunction().click();
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
      //For Website
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

    });




