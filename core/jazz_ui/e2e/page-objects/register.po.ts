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

export class Register {

  navigateTo() {
    return browser.get('');
  }

  getLoginButton(){
   return element(by.xpath('//div/jazz-header/header/div[2]/ul/li[5]/div/btn-jazz-primary/button'));
   //return element(by.xpath('//btn-jazz-primary/button[text()="LOGIN"]'));
  }

  getRegister(){
    return element(by.xpath('//div[@class="newUser"]/a[text()="Register"]'));
  }

  getUserName(){
    return element(by.xpath('//div[text()="User Email"]/following-sibling::input[@type="email"]'));
  }

  getPassword(){
    return element(by.xpath('//div[text()="Password "]/following-sibling::input[@type="password"]'));
  }

  getRegistrationCode(){
    return element(by.xpath('//div[text()="Registration Code"]/following-sibling::input[@name="Usercode"]'));
  }

  getRegisterButton(){
    return element(by.xpath('//div[@class="btn-wrp"]/btn-jazz-primary/button[text()="REGISTER"]'));
  }

  getDummy() {
    return element(by.xpath('//*[@id="exampleName"]'));
  }

}
