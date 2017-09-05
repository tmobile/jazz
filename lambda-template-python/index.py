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
