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
import { Register } from '../page-objects/register.po';


const timeOutHigh = 180000;
const config = CONFIGURATIONS.optional.general.e2e;

describe('register', () => {
    let register_po: Register;
    let JazzServices_po: Jazz;
    const EC = protractor.ExpectedConditions;

    beforeAll(() => {
      register_po = new Register();
      JazzServices_po = new Jazz();
    });
  
    it('backtologin', () => {
      JazzServices_po.navigateToJazzGet();
      register_po.getLoginButton().isPresent().
      then(function() { 
        browser.driver.switchTo().activeElement();
        register_po.getLoginButton().click();
        browser.driver.switchTo().activeElement();
      }, function(err) { 
        console.log(err);
        throw new Error("Page is not uploaded");
      });
      register_po.getRegister().isPresent().
      then(function() { 
        register_po.getRegister().click();
      }, function(err) { 
        console.log(err);
        throw new Error("Button is not uploaded");
      });
      browser.sleep(4000);
      register_po.getBackToLogin().click();
    });

    it('register', () => {
      browser.refresh();
      browser.driver.switchTo().activeElement();
      register_po.getLoginButton().click();
      browser.driver.switchTo().activeElement();
      browser.sleep(4000);
      register_po.getRegister().click();
      register_po.getUserName().sendKeys(config.REG_USER_NAME);
      register_po.getPassword().sendKeys(config.REG_PASS_WORD);
      register_po.getRegistrationCode().sendKeys(config.REG_CODE);
      register_po.getRegisterButton().click();
      browser.sleep(4000);
    });
});