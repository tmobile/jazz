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
import { Jazz } from '../page-objects/jazzservices.po';
import { CONFIGURATIONS } from '../../src/config/configuration';
import { Timeouts } from 'selenium-webdriver';
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

const timeOutHigh = 180000;
const emailId = CONFIGURATIONS.optional.general.e2e.EMAIL_ID;

describe('Overview', () => {
      let jazzServices_po: Jazz;
      const EC = protractor.ExpectedConditions;
      let winhandle;
      let servicename;

      beforeAll(() => {
            jazzServices_po = new Jazz();
      });

      function createservice(servicename){
            jazzServices_po.getServiceName().sendKeys(servicename);
            jazzServices_po.getNameSpace().sendKeys('jazztest');
            jazzServices_po.getServiceDescription().sendKeys('Testing');
      }

      function serviceapprover() {
            browser.driver.sleep(5000);
            jazzServices_po.getSubmit().click();
            jazzServices_po.getDone().click();
      }
    
      it('Create API Service', () => {
            browser.sleep(5000);
            browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
            winhandle = browser.getWindowHandle();
            //To create Service-API
            jazzServices_po.getCreateService().click();
            var min = 111111111;
            var max = 999999999;
            var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            servicename='servicename' + randomNum;
            createservice(servicename);
            serviceapprover();
            browser.driver.sleep(15000);
            //Assert-Verifying the created service,Type and Status of the API
            expect(jazzServices_po.getAwsServiceName().getText()).toEqual(servicename);
            expect(jazzServices_po.getAPIType().getText()).toEqual('api');
            expect(jazzServices_po.getAPIStatus().getText()).toEqual('creation started');
      });

      it('Verify API Service and Navigation', () => {
            browser.wait(EC.visibilityOf(jazzServices_po.getAwsServiceName()), timeOutHigh);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
            //To Navigate to the particular service and verifying the Page
            jazzServices_po.getAwsServiceName().click();
            expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
            browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
            browser.sleep(45000);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
            jazzServices_po.getRefresh().click();
            browser.sleep(30000);
            browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
            //To get the corresponding environment[Prod]
            jazzServices_po.getProdName().click();
            //Verifying the browser id at the Deployment Tab
            expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
            browser.wait(EC.visibilityOf(jazzServices_po.getProdHeader()), timeOutHigh);
            browser.wait(EC.visibilityOf(jazzServices_po.getRefresh()), timeOutHigh);
            browser.driver.switchTo().activeElement();
            browser.sleep(15000);
      });

      it('Verify API Deployments' , () => {
            jazzServices_po.getRefresh().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getDeploymentStatus()), timeOutHigh);
            jazzServices_po.getDeploymentStatus().click();
            browser.sleep(15000);
            jazzServices_po.getRefresh().click();
            jazzServices_po.getDeploymentStatusVerify();
            //Verifying the Deployment status
            expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
      });

      it('Verify API Asset' ,  () => {
            browser.wait(EC.visibilityOf(jazzServices_po.getAsset()), timeOutHigh);
            //To get the Asset Tab
            jazzServices_po.getAsset().click();
            //Verifying the Assets are ACTIVE
            expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
            browser.wait(EC.visibilityOf(jazzServices_po.getAssetHeader()), timeOutHigh);
            browser.sleep(4000);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getServiceFromAsset()), timeOutHigh);
      });

      it('Verify Logs' ,  () => {
            browser.wait(EC.visibilityOf(jazzServices_po.getLogs()), timeOutHigh);
            jazzServices_po.getLogs().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getFilterIcon()), timeOutHigh);
            browser.driver.switchTo().activeElement();
            jazzServices_po.getFilterIcon().click();
            jazzServices_po.getDropDown().click();
            jazzServices_po.getDay().click();
            browser.sleep(2000);
            jazzServices_po.getDropDown().click();
            jazzServices_po.getWeek().click();
            browser.sleep(2000);
            expect(jazzServices_po.getWeekVerify().getText()).toEqual('WEEK');
            jazzServices_po.getDropDown().click();
            jazzServices_po.getMonth().click();
            browser.sleep(2000);
            expect(jazzServices_po.getMonthVerify().getText()).toEqual('MONTH');
            jazzServices_po.getDropDown().click();
            jazzServices_po.getYear().click();
            expect(jazzServices_po.getYearVerify().getText()).toEqual('YEAR');
            browser.sleep(2000);
            jazzServices_po.getServiceFromAsset().click();
      });
      
            
      it('Create Lamda Service', () => {
            browser.driver.switchTo().activeElement();
            browser.driver.sleep(5000);
            browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
            jazzServices_po.getCreateService().click();
            browser.driver.switchTo().activeElement();
            browser.driver.sleep(5000);
            //Creating the Lambda
            jazzServices_po.getLambda().click();
            var min = 111111111;
            var max = 999999999;
            var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            servicename='servicename' + randomNum;
            createservice(servicename);
            jazzServices_po.getEventScheduleFixedRate().click();
            serviceapprover();
            browser.driver.sleep(30000);
            //Verifying the Lambda is correct
            expect(jazzServices_po.getAwsServiceName().getText()).toEqual(servicename);
            expect(jazzServices_po.getFunctionType().getText()).toEqual('function');
            expect(jazzServices_po.getFunctionStatus().getText()).toEqual('creation started');
      });
      
      it('Verify Function ', () => {
            browser.wait(EC.visibilityOf(jazzServices_po.getAwsServiceName()), timeOutHigh);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
            jazzServices_po.getLamdaName().click();
            expect(jazzServices_po.getOverviewStatus().getText()).toEqual('OVERVIEW');
            browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
            browser.sleep(40000);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
            jazzServices_po.getRefresh().click();
            browser.sleep(40000);
            //Moving to Production Environment
            browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
            jazzServices_po.getProdName().click();
            browser.sleep(60000);
            expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
            browser.wait(EC.visibilityOf(jazzServices_po.getProdHeader()), timeOutHigh);
            browser.wait(EC.visibilityOf(jazzServices_po.getRefresh()), timeOutHigh);
            browser.driver.switchTo().activeElement();
            browser.sleep(30000);
      });
  
      it('Verify Lamda Deployments' , () => {
            jazzServices_po.getRefresh().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getDeploymentStatus()), timeOutHigh);
            jazzServices_po.getDeploymentStatus().click();
            browser.sleep(15000);
            jazzServices_po.getRefresh().click();
            jazzServices_po.getDeploymentStatusVerify();
            expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
            
      });
    
      it('Verify Lamda Asset' ,  () => {
            jazzServices_po.getRefresh().click();
            browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
            jazzServices_po.getRefresh().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getAsset()), timeOutHigh);
            jazzServices_po.getAsset().click();
            //Checking Assets are Active
            expect(jazzServices_po.getAssetStatusVerify().getText()).toEqual('ACTIVE');
            browser.wait(EC.visibilityOf(jazzServices_po.getAssetHeader()), timeOutHigh);
            browser.sleep(4000);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getServiceFromAsset()), timeOutHigh);
      });

      it('Verify Logs' ,  () => {
            browser.wait(EC.visibilityOf(jazzServices_po.getLogs()), timeOutHigh);
            jazzServices_po.getLogs().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getFilterIcon()), timeOutHigh);
            browser.driver.switchTo().activeElement();
            jazzServices_po.getFilterIcon().click();
            jazzServices_po.getDropDown().click();
            jazzServices_po.getDay().click();
            browser.sleep(2000);
            jazzServices_po.getDropDown().click();
            jazzServices_po.getWeek().click();
            browser.sleep(2000);
            expect(jazzServices_po.getWeekVerify().getText()).toEqual('WEEK');
            jazzServices_po.getDropDown().click();
            jazzServices_po.getMonth().click();
            browser.sleep(2000);
            expect(jazzServices_po.getMonthVerify().getText()).toEqual('MONTH');
            jazzServices_po.getDropDown().click();
            jazzServices_po.getYear().click();
            expect(jazzServices_po.getYearVerify().getText()).toEqual('YEAR');
            browser.sleep(2000);
            jazzServices_po.getServiceFromAsset().click();
      });
      
      it('Create Website Service', () => {
            browser.driver.switchTo().activeElement();
            browser.driver.sleep(5000);
            browser.wait(EC.visibilityOf(jazzServices_po.getCreateService()), timeOutHigh);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getCreateService()), timeOutHigh);
            jazzServices_po.getCreateService().click();
            browser.driver.switchTo().activeElement();
            browser.driver.sleep(5000);
            //Creating Website
            jazzServices_po.getWebsite().click();
            var min = 111111111;
            var max = 999999999;
            var randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
            servicename='servicename' + randomNum;
            createservice(servicename);
            serviceapprover();
            browser.driver.sleep(15000);
            //Verifying the service
            expect(jazzServices_po.getAwsServiceName().getText()).toEqual(servicename);
            expect(jazzServices_po.getWebsiteType().getText()).toEqual('website');
            expect(jazzServices_po.getWebsiteStatus().getText()).toEqual('creation started');
      });

      it('Verify Website Page Title', () => {
            browser.wait(EC.visibilityOf(jazzServices_po.getAwsServiceName()), timeOutHigh);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getAwsServiceName()), timeOutHigh);
            jazzServices_po.getWebsiteName().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
            browser.sleep(45000);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
            jazzServices_po.getRefresh().click();
            browser.sleep(30000);
            browser.wait(EC.visibilityOf(jazzServices_po.getServiceNameHeader()), timeOutHigh);
            jazzServices_po.getProdName().click();
            //Verification of the Deployment tab
            expect(jazzServices_po.getDeploymentStatus().getText()).toEqual('DEPLOYMENTS');
            browser.wait(EC.visibilityOf(jazzServices_po.getProdHeader()), timeOutHigh);
            browser.wait(EC.visibilityOf(jazzServices_po.getRefresh()), timeOutHigh);
            browser.driver.switchTo().activeElement();
            browser.sleep(15000);
      });

      it('Verify Website Deployments' , () => {
            jazzServices_po.getRefresh().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getDeploymentStatus()), timeOutHigh);
            jazzServices_po.getDeploymentStatus().click();
            browser.sleep(15000);
            jazzServices_po.getRefresh().click();
            jazzServices_po.getDeploymentStatusVerify();
            //Checking the deployment is successful
            expect(jazzServices_po.getDeploymentStatusVerify().getText()).toEqual('Successful');
      });

      it('Verify Website Asset Name' ,  () => {
            jazzServices_po.getRefresh().click();
            browser.wait(EC.elementToBeClickable(jazzServices_po.getRefresh()), timeOutHigh);
            jazzServices_po.getRefresh().click();
            browser.wait(EC.visibilityOf(jazzServices_po.getAsset()), timeOutHigh);
            //Asset Tab Navigagation
            jazzServices_po.getAsset().click();
            //Checking Assets are Active
            expect(jazzServices_po.getAssetStatusVerify().getText().then(function(text){ return text.toLowerCase()})).toEqual('active'); 
            browser.wait(EC.visibilityOf(jazzServices_po.getAssetHeader()), timeOutHigh);
            browser.sleep(4000);
            browser.wait(EC.elementToBeClickable(jazzServices_po.getServiceFromAsset()), timeOutHigh);
      });

});




