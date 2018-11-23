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
    return element(by.css('div.login'));                   
  }

  getForgotPasswordButton(){
    return element(by.css('div.forgot-password'));                   
  }
  getForgotPasswordSubmit(){
    return element(by.css('div.btn-wrp'));                   
  }
 
  getBackToLogin(){
    return element(by.css('div.forgot-password'));                   
  }
}
