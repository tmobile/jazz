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
import { ForgotPassword } from '../page-objects/forgotpassword.po';

const timeOutHigh = 180000;

describe('forgotpassword', () => {
    let forgotpassword_po: ForgotPassword;
    const EC = protractor.ExpectedConditions;

    beforeAll(() => {
      forgotpassword_po = new ForgotPassword();
    });

    it('forgotpassword', () => {
      browser.refresh();
      browser.driver.switchTo().activeElement();
      forgotpassword_po.getLoginPassButton().click();
      browser.wait(EC.visibilityOf(forgotpassword_po.getForgotPasswordButton()), timeOutHigh);
      forgotpassword_po.getForgotPasswordButton().click();
      forgotpassword_po.getForgotPasswordSubmit().click();
      forgotpassword_po.getBackToLogin().click();
    });
});
