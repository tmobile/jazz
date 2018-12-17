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
    return element(by.xpath('//li[@class="x caps" and contains(text(),"assets")]'));
  }
  getAssetHeader(){
    return element(by.xpath('//div/div[2]/div/section[1]/div/div[2]/section/env-assets-section/div/div[1]/div[2]/div[1]/div[1]/span[2]'));
  }
  getRefresh(){ 
    return element(by.xpath('*//div[@class="refresh-button"]'));
  }
  getServiceFromAsset(){
    return element(by.xpath('//div[@class="navigation-item"]/span[@class="icon-icon-back hide"]/following-sibling::a[text()="Services"]'));
  } 
  getWebsiteName(){
    return element(by.xpath('//div[@class="table-row pointer"]/div[text()="website"]/preceding-sibling::div'));  
  }
  getDeploymentStatus(){
    return element(by.xpath('//li[@class="x caps" and contains(text(),"deployments")]'));  
  }
  getDeploymentStatusVerify(){
    return element(by.xpath('//div[@class="column status-col"]/div[@class="green"]'));
  }
  getAssetStatusVerify(){
    return element(by.xpath('//div[@class="det-value"]'));
  }
  getLamdaName(){
    return element(by.xpath('//div[@class="table-row pointer"]/div[text()="function"]/preceding-sibling::div'));
  }
  getOverviewStatus(){
    return element(by.xpath('//li[@class="x caps active" and contains(text(),"overview")]'));  
  }
  getLogs(){
    return element(by.xpath('//li[@class="x caps" and contains(text(),"logs")]'));
  }
  getFilterIcon(){
	 return element(by.xpath('//div[@class="filter-icon relative"]'));
  }
  getDay(){
   return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Day")]'));
  }
  getWeek(){
    return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Week")]'));
  }
  getMonth(){
    return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Month")]'));
  }
  getYear(){
    return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Year")]'));
  }
  getDropDown(){
    return element(by.xpath('//div[text()="TIME RANGE"]/following-sibling::dropdown[@title="Select range"]/div[@class="dropdown"]/button[@class="btn dropdown-btn dropdown-toggle"]'));
  }
  getWeekVerify()
  {
	return element(by.xpath('//div[@class="row"]/div[contains(text(),"Time Range")]/b[text()="Week"]'));
  }
  getMonthVerify()
  {
	return element(by.xpath('//div[@class="row"]/div[contains(text(),"Time Range")]/b[text()="Month"]'));
  }
  getYearVerify()
  {
	return element(by.xpath('//div[@class="row"]/div[contains(text(),"Time Range")]/b[text()="Year"]'));
  }
 }
