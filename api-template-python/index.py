# =========================================================================
# Copyright 2017 T-Mobile USA, Inc.
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

import sys
import os
import json

from components.errors import CustomErrors  # noqa
from components.response import CustomResponse
from components.logger import Logger
from components.config import Config


def handler(event, context):
    try:

        # initialze logger module
        logger = Logger(event, context)

        # Load config handler.
        config = Config(event)

        logger.error('Runtime errors or unexpected conditions.')
        logger.warn('Runtime situations that are undesirable, but not wrong')
        logger.info('Interesting runtime events eg. connection established)')
        logger.verbose('Generally speaking, most log lines should be verbose.')
        logger.debug('Detailed information on the flow through the system.')

        # This is the happy path
        data = {
            'key': 'value'
        }

        response = ""
        if 'method' in event:
            if event['method'] == "POST":
                # Handle Post response here
                response = CustomResponse(data, event['body']).get_json()
            else:
                # Handle Get/other response here.
                response = CustomResponse(data, event['query']).get_json()
        return response
    except Exception as e:
        # Exception Handling
        exception_type = e.__class__.__name__
        exception_message = e.message

        # Create a JSON string here
        api_exception_json = CustomErrors.throwInternalServerError(
            exception_message)
        raise LambdaException(api_exception_json)


class LambdaException(Exception):
    pass
