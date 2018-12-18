import sys
import os
import json

sys.path.insert(0, 'library')

from components.errors import CustomErrors
from components.response import CustomResponse
from components.logger import Logger
from components.config import Config

# import installed package
import requests

def handler(event, context):
    try:
        # initialize logger module
        logger = Logger(event, context)

        # Load config handler.
        config = Config(event)
        
        ## ==== Sample code to fetch environment specific configurations ====
        # myconfig = config.get_config('default')
        # logger.info ('One of the environment configuration: config_key => ' + myconfig['config_key'])

        # logger.error('Runtime errors or unexpected conditions.')
        # logger.warn('Runtime situations that are undesirable, but not wrong')
        # logger.info('Interesting runtime events eg. connection established)')
        # logger.verbose('Generally speaking, most log lines should be verbose.')
        # logger.debug('Detailed information on the flow through the system.')

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
