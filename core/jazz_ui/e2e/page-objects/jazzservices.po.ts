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

import { browser, by, element, $, $$ } from 'protractor';
import { CONFIGURATIONS } from '../../src/config/configuration';
const fs = require('fs');
const config = CONFIGURATIONS.optional.general.e2e;
export class Jazz {

  navigateToJazzGet() {
    return browser.driver.get(config.APPLN_URL);
  }
  getCreateService() {
    return element(by.css('div.btn-text'));
  }
  getPageTitle() {
    return element(by.xpath('//div/div[2]/div/services-list/section/navigation-bar/div'));
  }
  getLambda() {
    return element(by.css('div.service-box>div.icon-icon-function'));
  }
  getWebsite() {
  return element(by.css('div.service-box>div.icon-icon-web'));
  }
  getServiceName() {
    return element(by.css('input#serviceName'));
  }
  getNameSpace() {
      return element(by.css('input#domainName'));
  }
  getApplication() {
      return element(by.xpath('//*[@id="applc"]'));
  }
  getServiceDescription() {
      return element(by.css('div.input-field-container>div.input-wrapper>textarea'));
  }
  getEventScheduleFixedRate() {
      return element(by.css('div.radio-container>label[for="fixedRate"]'));
  }
  getAwsServiceName() {
      return element(by.xpath('(//table-template//div[@class="table-row pointer"]/div)[1]'));
  }
  getAPIType() {
      return element(by.xpath('//div[@class="table-row pointer"]//div[text()="api"]'));
  }
  getFunctionType() {
      return element(by.xpath('//div[@class="table-row pointer"]//div[text()="function"]'));
  }
  getWebsiteType() {
      return element(by.xpath('//div[@class="table-row pointer"]//div[text()="website"]'));
  }
  getAPIStatus() {
      return element(by.xpath('//div[@class="table-row pointer"]/div[text()="api"]/parent::div/div[5]'));
  }
  getFunctionStatus() {
      return element(by.xpath('//div[@class="table-row pointer"]/div[text()="function"]/parent::div/div[5]'));
  }
  getWebsiteStatus() {
      return element(by.xpath('//div[@class="table-row pointer"]/div[text()="website"]/parent::div/div[5]'));
  }
  getDummy() {
      return element(by.xpath('//*[@id="exampleName"]'));
  }
  getApprover() {
      return element(by.xpath('//*[@id="approverName"]'));
  }
  getApproverClick() {
     return element(by.xpath('//div[@class="approvers-list-wrap"]//div[@class="approvers-dets"]/div[@displayname="Elizabeth Johnson"]'));
  }
  getSubmit() {
     return element(by.css('section.submit-form>button.btn'));
  }
  getDone() {
     return element(by.css('section.footer-btn>btn-jazz-primary'));
    }
  getServiceNameHeader() {
      
    return element(by.xpath('//div[@class="page-title-wrap hide-for-mobile"]/h1[@class="page-hdr bold-title"]'));
  }
  getProdName(){
    return element(by.xpath('//div[@class="stage-title stageDisp" and contains(text(),"prod")]'))
  }
  getProdHeader(){
    return element(by.xpath('//div[@class="servie-details-container"]/h1[@class="page-hdr bold-title relative" and contains(text(),"prod")]'));
  }
  getAsset(){
    return element(by.xpath('//div/div[2]/div/section[1]/div/div[2]/tabs/div/ul/li[3]'));
  }
  getAssetHeader(){
    return element(by.xpath('//div/div[2]/div/section[1]/div/div[2]/section/env-assets-section/div/div[1]/div[2]/div[1]/div[1]/span[2]'));
  }
  getRefresh(){ 
    return element(by.css('div.tab-component>div.refresh-button'));
  }
  getServiceFromAsset(){
    return element(by.xpath('//div[@class="navigation-item"]/span[@class="icon-icon-back hide"]/following-sibling::a[text()="Services"]'));
  } 
  getLamdaName(){
    return element(by.xpath('//div[@class="table-row pointer"]/div[text()="function"]/preceding-sibling::div'));
  }
  getWebsiteName(){
    return element(by.xpath('//div[@class="table-row pointer"]/div[text()="website"]/preceding-sibling::div'));  
  }
  getOverviewStatus(){
    return element(by.xpath('//li[@class="x caps active" and contains(text(),"overview")]'));  
  }
  getDeploymentStatus(){
    return element(by.xpath('//li[@class="x caps" and contains(text(),"deployments")]'));  
  }
  getDeploymentStatusVerify(){
    return element(by.xpath('//div[@class="column status-col"]/div[@class="green"]'));
  }
  getAssetStatusVerify(){
    return element(by.xpath('//li[@class="x caps active"]'));
  }
  getAPIServiceName(){
    return element(by.xpath('//div[@class="table-row pointer"]/div[text()="api"]/preceding-sibling::div'));
 }
 
 }
