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

export class Login {

  navigateTo() {
    return browser.get('');
  }
  getLoginButton(){
    return element(by.css('div.login'));                   
  }
  getUserNameInput() {
      return element(by.css('input[name=Username]'));
  }
  getPasswordInput() {
    return element(by.css('input[name=password]'));
  }
  submitLoginButton() {
    return element(by.css('div.btn-wrp'));
  }
  submitUsername() {
    return element(by.id('i0116'));
  }
  typeUserText() {
    return element(by.css('//input[@name="loginfmt"]'));
  }
  clickNext()
  {
    return element(by.css('//input[@type="email"]'));
  }
  submitNext(){
     return element(by.id('idSIButton9'));
  }
}
