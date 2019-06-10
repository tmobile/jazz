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

export const CONFIGURATIONS = {
  required: {

  },
  optional: {
    general: {
      ACCESS_MANAGEMENT_PORTAL_URL: '',
      e2e: {
        EMAIL_ID: '{stack_email}',            
        USER_NAME: '{stack_username}',  
        PASSWORD: '{stack_password}',  
        REG_USER_NAME: '{stack_reg_username}', 
        REG_PASS_WORD: '{stack_reg_password}', 
        REG_CODE: '{stack_reg_code}', 
        APPLN_URL: '{stack_jazz_url}',
        SCM_URL: '{scm_url}',
        SCM_USERNAME: '{scm_username}',
        SCM_PASSWORD: '{scm_password}'
      }
    }
  }
};
