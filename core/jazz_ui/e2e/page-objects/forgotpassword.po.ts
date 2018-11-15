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

import { browser, by, element } from 'protractor';

export class ForgotPassword{
  
  navigateTo() {
    return browser.get('');

  }
  getLoginPassButton(){
    return element(by.xpath('//btn-jazz-primary[@newclass="login"]/button[text()="LOGIN"]'));                   
  }

  getForgotPasswordButton(){
    return element(by.xpath('//div[@class="forgot-password"]/a[text()="Forgot Password"]'));                   
  }
  getForgotPasswordSubmit(){
    return element(by.xpath('//btn-jazz-primary[@newclass="loginbutton"]/button[text()="SUBMIT"]'));                   
  }
 
  getBackToLogin(){
    return element(by.xpath('//div[@class="forgot-password"]/a[text()="Back to login"]'));                   
  }
}
