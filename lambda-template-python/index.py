# =========================================================================
# Copyright © 2017 T-Mobile USA, Inc.
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =========================================================================

#   Python Template Project
#   @Author:
#   @version: 1.0
import sys
import os
import json

from components.logger import Logger
from components.config import Config
from components.secret_handler import SecretHandler

# import installed package
from library import requests


def handler(event, context):
    # initialze logger module
    logger = Logger(event, context)

    # Load config handler & SecretHandler
    config = Config(context)
    secret_handler = SecretHandler()

    ## ==== Sample code to fetch environment specific configurations ====
    myconfig = config.get_config('default')
    logger.info ('One of the environment configuration: config_key => ' + myconfig['config_key'])

    ## ==== Sample code to handle secrets in your code ====
    # get secret information(mysecret1) from the config
    #encrypted_secret = config.get_config('mysecret')

    # Decrypt the secret
    #secret_res = secret_handler.decrypt_secret(encrypted_secret)

    # Check if error exists & if not get the decrypted secret
    #if 'error' in secret_res and secret_res['error'] is not None:
    #    decryptionerror = secret_res['message']
    #else:
    #    plaintext = secret_res['message']

    ## ==== Log message samples ====
    logger.error('Runtime errors or unexpected conditions.')
    logger.warn('Runtime situations that are undesirable, but not wrong')
    logger.info('Interesting runtime events eg. connection established)')
    logger.verbose('Generally speaking, most log lines should be verbose.')
    logger.debug('Detailed information on the flow through the system.')

    return {
        "message": "Go Serverless! Your function executed successfully!",
        "event": event
    }
