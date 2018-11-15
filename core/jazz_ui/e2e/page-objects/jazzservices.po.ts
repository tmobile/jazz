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
    return element(by.xpath('//div[@class="page-title-wrap hide-for-mobile"]/btn-primary-with-icon[@text="CREATE SERVICE"]'));
  }
  getPageTitle() {
    return element(by.xpath('//div/div[2]/div/services-list/section/navigation-bar/div'));
  }
  getFunction() {
    return element(by.xpath('//div[@class="service-box"]/p[text()="FUNCTION"]/parent::div/parent::section'));
  }
  getLambda() {
    return element(by.xpath('//div[@class="service-box"]/p[text()="LAMBDA"]/parent::div/parent::section'));
  }
  getWebsite() {
  return element(by.xpath('//div[@class="service-box"]/p[text()="WEBSITE"]/parent::div/parent::section'));
  }
  getAws() {
      return element(by.xpath('/html/body/app-root/div/services/div/div[2]/div/services-list/sidebar/div/div[2]/create-service/div/div/section[2]/div/div[2]/section[1]/div/div/span[33]'));
  }
  getNodeJSRunTime() {
      return element(by.xpath('/html/body/app-root/div/services/div/div[2]/div/services-list/sidebar/div/div[2]/create-service/div/div/section[3]/div/div[2]/div/section[1]/div/label'));
  }
  getServiceName() {
    return element(by.xpath('//*[@id="serviceName"]'));
  }
  getNameSpace() {
      return element(by.xpath('//*[@id="domainName"]'));
  }
  getApplication() {
      return element(by.xpath('//*[@id="applc"]'));
  }
  getServiceDescription() {
      return element(by.xpath('//*[@id="serviceDescription"]'));
  }
  getEventScheduleFixedRate() {
      return element(by.xpath('//div[@class="radio-container"]/label[@for="fixedRate"]'));
  }
  getAwsEventsNone() {
      return element(by.xpath('//div[@class="radio-container"]/label[@for="awsEventsNone"]'));
  }
   getAPIServiceName() {
      return element(by.xpath('//div[@class="table-row pointer"]/div[text()="api"]/preceding-sibling::div'));
  }
  getFunctionServiceName() {
      return element(by.xpath('//div[@class="table-row pointer"]/div[text()="function"]/preceding-sibling::div'));
  }
  getWebsiteServiceName() {
      return element(by.xpath('//div[@class="table-row pointer"]/div[text()="website"]/preceding-sibling::div'));
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
  getApplicationClick() {
      return element(by.xpath('//div[@class="approvers-list-wrap"]//div[@appname="ABC Services"]'));
  }
  getApprover() {
      return element(by.xpath('//*[@id="approverName"]'));
  }
  getApproverClick() {
     return element(by.xpath('//div[@class="approvers-list-wrap"]//div[@class="approvers-dets"]/div[@displayname="Elizabeth Johnson"]'));
  }
  getSubmit() {
     return element(by.xpath('//section[@class="submit-form"]/button[@type="submit"]'));
  }
  getDone() {
     return element(by.xpath('//section[@class="footer-btn"]/btn-jazz-primary[@text="DONE"]/button[text()="DONE"]'));
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
    return element(by.xpath('//div[@class="tab-component"]/div[@class="refresh-button"]/span[text()="Refresh"]'));
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
 }
