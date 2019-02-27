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
    return element(by.xpath('//div/div[2][@class="table-row pointer"]//div[text()="api"]'));
  }
  getFunctionType() {
    return element(by.xpath('//div/div[2][@class="table-row pointer"]//div[text()="function"]'));
  }
  getWebsiteType() {
    return element(by.xpath('//div/div[2][@class="table-row pointer"]//div[text()="website"]'));
  }
  getAPIStatus() {
    return element(by.xpath('//div/div[2][@class="table-row pointer"]/div[text()="api"]/parent::div/div[5]'));
  }
  getFunctionStatus() {
    return element(by.xpath('//div/div[2][@class="table-row pointer"]/div[text()="function"]/parent::div/div[5]'));
  }
  getWebsiteStatus() {
    return element(by.xpath('//div/div[2][@class="table-row pointer"]/div[text()="website"]/parent::div/div[5]'));
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
  getProdName() {
    return element(by.xpath('//div[@class="stage-title stageDisp" and contains(text(),"prod")]'))
  }
  getProdHeader() {
    return element(by.xpath('//div[@class="servie-details-container"]/h1[@class="page-hdr bold-title relative" and contains(text(),"prod")]'));
  }
  getAsset() {
    return element(by.xpath('//li[@class="x caps" and contains(text(),"assets")]'));
  }
  getAssetHeader() {
    return element(by.xpath('//div/div[2]/div/section[1]/div/div[2]/section/env-assets-section/div/div[1]/div[2]/div[1]/div[1]/span[2]'));
  }
  getRefresh() {
    return element(by.xpath('*//div[@class="refresh-button"]'));
  }
  getServiceFromAsset() {
    return element(by.xpath('//div[@class="navigation-item"]/span[@class="icon-icon-back hide"]/following-sibling::a[text()="Services"]'));
  }
  getWebsiteName() {
    return element(by.xpath('//div[@class="table-row pointer"]/div[text()="website"]/preceding-sibling::div'));
  }
  getDeploymentStatus() {
    return element(by.xpath('//li[@class="x caps" and contains(text(),"deployments")]'));
  }
  getDeploymentStatusVerify() {
    return element(by.xpath('//div[contains(text(),"successful")]'));
  }
  getAssetStatusVerify() {
    return element(by.xpath('//div/div[1]/div[2]/div/div[2]/ul[1]/li[1]/div[2]'));
  }
  getLamdaName() {
    return element(by.xpath('//div[@class="table-row pointer"]/div[text()="function"]/preceding-sibling::div'));
  }
  getOverviewStatus() {
    return element(by.xpath('//li[@class="x caps active" and contains(text(),"overview")]'));
  }
  getLogs() {
    return element(by.xpath('//li[@class="x caps" and contains(text(),"logs")]'));
  }
  getFilterIcon() {
    return element(by.xpath('//div[@class="filter-icon relative"]'));
  }
  getDay() {
    return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Day")]'));
  }
  getWeek() {
    return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Week")]'));
  }
  getMonth() {
    return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Month")]'));
  }
  getYear() {
    return element(by.xpath('//div[@class="dropdown open"]/ul[@class="dropdown-menu"]/li/a[(text()="Year")]'));
  }
  getDropDown() {
    return element(by.xpath('//div[text()="TIME RANGE"]/following-sibling::dropdown[@title="Select range"]/div[@class="dropdown"]/button[@class="btn dropdown-btn dropdown-toggle"]'));
  }
  getWeekVerify() {
    return element(by.xpath('//div[@class="row"]/div[contains(text(),"Time Range")]/b[text()="Week"]'));
  }
  getMonthVerify() {
    return element(by.xpath('//div[@class="row"]/div[contains(text(),"Time Range")]/b[text()="Month"]'));
  }
  getYearVerify() {
    return element(by.xpath('//div[@class="row"]/div[contains(text(),"Time Range")]/b[text()="Year"]'));
  }
  homePageRefresh() {
    return element(by.xpath('//span[@title="Refresh"]'));
  }
  serviceStatus() {
    return element(by.xpath('//div[@class="table-body"]//div[2]//div[contains(text(),"active")]'));
  }
  getMetrices() {
    return element(by.xpath('//li[contains(text(),"metrics")]'));
  }
  getTestAPI() {
    return element(by.xpath('//button[text()="TEST API"]'));
  }
  getAPIGET() {
    return element(by.xpath('//span[contains(text(),"GET")]'));
  }
  getAPIPOST() {
    return element(by.xpath('//span[contains(text(),"POST")]'));
  }
  getTryOut() {
    return element(by.xpath('//button[@class="btn try-out__btn"]'));
  }
  getStringA() {
    return element(by.xpath('//input[@placeholder="a"]'));
  }
  getStringB() {
    return element(by.xpath('//input[@placeholder="b"]'));
  }
  getExecute() {
    return element(by.css('div.execute-wrapper>button'));
  }
  getMetricesCount() {
    return element(by.xpath('//div[@class="metrics-footer"][contains(text(),"Count")]/preceding-sibling::div[@class="metrics-card-content"]'));
  }
  getXXError() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(1)'));
  }
  getXXErrorFive() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(2)'));
  }
  getCacheHitCount() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(3)'));
  }
  getCacheMissCount() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(4)'));
  }
  getCount() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(5)'));
  }
  getIntegrationLatency() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(6)'));
  }
  getLatency() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(7)'));
  }
  getTestFunction() {
    return element(by.xpath('//btn-jazz-secondary[@class="testApiBtn"]/button[text()="TEST FUNCTION"]'));
  }
  getTestArea() {
    return element(by.xpath('//textarea[contains(@class,"input-textarea")]'));
  }
  getTestButton() {
    return element(by.xpath('//div/button[@class="btn-round primary start-button"]'));
  }
  getClose() {
    return element(by.xpath('//div[@class="sidebar-frame"]//div[@class="icon-icon-close pointer"]'));
  }
  getInvocations() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(1)'));
  }
  getWebsiteLink() {
    return element(by.xpath('//btn-jazz-secondary[@class="testApiBtn"]/button[text()="GO TO WEBSITE"]'));
  }
  getMetricsChildOne() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(1)'));
  }
  getMetricsChildTwo() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(2)'));
  }
  getMetricsChildThree() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(3)'));
  }
  getMetricsChildFour() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(4)'));
  }
  getMetricsChildFive() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(5)'));
  }
  getMetricsChildSix() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(6)'));
  }
  getMetricsChildSeven() {
    return element(by.css('div.metrics-carousel-scroller>div.metrics-card:nth-child(7)'));
  }
  serverResponse() {
    return element(by.xpath('//td[@class="col response-col_status"][contains(text(),"200")]'));
  }
  goToFunction() {
    return element(by.xpath('//button[@class="btnT-radial-in"]'));
  }
  testSuccessMessage() {
    return element(by.xpath('//span[contains(text(),"Function got triggered successfully")]'));
  }
  websiteTemplete() {
    return element(by.xpath('//p[contains(text(),"Jazz Serverless Platform Website Template")]'));
  }
  getMetricesRequestCount() {
    return element(by.xpath('//div[contains(text(),"10")]'));
  }
  // Environment Locators
  getRepository() {
    return element(by.xpath('//div[contains(@class,"det-value repository-link link PlaceHolder")]'));
  }
  // bitbucket locators
  bitbucketLogo() {
    return element(by.xpath('//span[@class="aui-header-logo-device"]'));
  }
  createBranch() {
    return element(by.xpath('//span[@class="aui-icon icon-create-branch"]'));
  }
  drp_BranchType() {
    return element(by.xpath('//a[@id="branch-type"]'));
  }
  select_BranchType() {
    return element(by.xpath('//a[contains(text(),"Feature")]'));
  }
  branchName() {
    return element(by.xpath('//input[@id="branch-name"]'));
  }
  btn_CreateBranch() {
    return element(by.xpath('//input[@id="create-branch-submit"]'));
  }
  bitUsername() {
    return element(by.xpath('//*[@id="j_username"]'));
  }
  bitPassword() {
    return element(by.xpath('//*[@id="j_password"]'));
  }
  bitLogin() {
    return element(by.xpath('//*[@id="submit"]'));
  }
  testBranch() {
    return element(by.xpath('//div[@class="eachBranch col-md-2 col-sm-5"]//div//div[@class="overview-value"]'));
  }
  getTestBranch() {
    return element(by.xpath('//div[@class="eachBranch col-md-2 col-sm-5"]//div//div[@class="overview-value"]'));
  }
  bitbucketGetServiceName() {
    return element(by.css('li:nth-child(2).aui-nav-selected>a'));
  }
  createBranchLabel() {
    return element(by.xpath('//h2[contains(text(),"Create branch")]'));
  }
  testBranchStatus() {
    return element(by.xpath('//div[@class="eachBranch col-md-2 col-sm-5"]//div//span[@title="deployment completed"]'));
  }
  drpBitTestBranch() {
    return element(by.xpath('//button[@id="repository-layout-revision-selector"]'));
  }
  selectBitTestBranch() {
    return element(by.xpath('//a/span[@title="feature/test"]'));
  }
  indexFile() {
    return element(by.xpath('//a[contains(text(),"index.js")]'));
  }
  btnEditIndexFile() {
    return element(by.xpath('//button[@class="aui-button in-browser-edit-button"]'));
  }
  editIndexFile() {
    return element(by.xpath('//div[@class="CodeMirror-code"]'));
  }
  getBranchFileCommit() {
    return element(by.xpath('//button[@title="Commit your changes"]'));
  }
  getDialogCommit() {
    return element(by.xpath('//button[@class=aui-button aui-button-primary commit-button"]'));
  }
  //gitlab locators
  drpGitBranchType() {
    return element(by.xpath('//a[@class="btn dropdown-toggle has-tooltip"]//i[@class="fa fa-caret-down"]'));
  }
  selectGitBranchType() {
    return element(by.xpath('//a[text()="New branch"]'));
  }
  gitBranchName() {
    return element(by.xpath('//input[@id="branch_name"]'));
  }
  btnGitCreateBranch() {
    return element(by.xpath('//button[contains(text(),"Create branch")]'));
  }
  getSpinner() {
    return element(by.css('div.loading-circle'));
  }
  getMetricsSpinner() {
    return element(by.css('div.jz-spinner'));
  }
}
