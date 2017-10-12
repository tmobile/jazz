# =========================================================================
# Copyright � 2017 T-Mobile USA, Inc.
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

# import installed package
from library import requests


def handler(event, context):
    # initialze logger module
    logger = Logger(event, context)

    # Load config handler
    config = Config(context)

    ## ==== Sample code to fetch environment specific configurations ====
    myconfig = config.get_config('default')
    # logger.info ('One of the environment configuration: config_key => ' + myconfig['config_key'])

    ## ==== Log message samples ====
    # logger.error('Runtime errors or unexpected conditions.')
    # logger.warn('Runtime situations that are undesirable, but not wrong')
    # logger.info('Interesting runtime events eg. connection established)')
    # logger.verbose('Generally speaking, most log lines should be verbose.')
    # logger.debug('Detailed information on the flow through the system.')

    return {
        "message": "Your function executed successfully!",
        "event": event
    }
