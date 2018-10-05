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
import { CONFIGURATIONS } from '../../src/config/configurations';

const timeOutHigh = 180000;
const config = CONFIGURATIONS.optional.general.e2e;

describe('login', () => {
  let login_po: Login;
  let JazzServices_po: Jazz;
  const EC = protractor.ExpectedConditions;

  beforeAll(() => {
    login_po = new Login();
    JazzServices_po = new Jazz();
  });


  it('login', () => {
    JazzServices_po.navigateToJazzGet();
    browser.wait(EC.visibilityOf(login_po.getLoginButton()), timeOutHigh);
    login_po.getLoginButton().click();
    login_po.getUserNameInput().sendKeys(config.NT_ID);
    login_po.getPasswordInput().sendKeys(config.NT_PASSWORD);
    login_po.submitLoginButton().click();
    browser.wait(EC.visibilityOf(JazzServices_po.getPageTitle()), timeOutHigh);
    const page_title = JazzServices_po.getPageTitle().getText();
    expect(page_title).toEqual('Services');
  });

});
