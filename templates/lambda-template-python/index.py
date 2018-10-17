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
