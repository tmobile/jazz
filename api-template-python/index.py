import sys
import os
import json

from components.errors import CustomErrors  # noqa
from components.response import CustomResponse
from components.logger import Logger
from components.config import Config
from components.secret_handler import SecretHandler


def handler(event, context):
    try:

        # initialze logger module
        logger = Logger(event, context)

        # Load config handler & SecretHandler.
        config = Config(event)
        secret_handler = SecretHandler()

        # get secret information(mysecret) from the config
        encrypted_secret = config.get_config('mysecret1')

        # Decrypt the secret.
        secret_res = secret_handler.decrypt_secret(encrypted_secret)

        # Check if error exists & if not get the decrypted secret
        if 'error' in secret_res and secret_res['error'] is not None:
            decryptionerror = secret_res['message']
        else:
            plaintext = secret_res['message']

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
