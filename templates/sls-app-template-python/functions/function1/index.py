import sys
import os
import json


sys.path.append(".")
sys.path.insert(0, 'library')

from components.logger import Logger
from components.config import Config

# import installed package
import requests

def handler(event, context):
    # initialize logger module
    logger = Logger(event, context)
   
    # Load config handler   
    config = Config(context)

    ## ==== Sample code to fetch environment specific configurations ====
    # myconfig = config.get_config('default') === "default" is the section over here
    # logger.info ('One of the environment configuration: config_key => ' + myconfig['config_key'])

    ## ==== Log message samples ====
    # logger.error('Runtime errors or unexpected conditions.')
    # logger.warn('Runtime situations that are undesirable, but not wrong')
    # logger.info('Interesting runtime events eg. connection established)')
    # logger.verbose('Generally speaking, most log lines should be verbose.')
    # logger.debug('Detailed information on the flow through the system.')

    myconfig = config.get_config('default')

    logger.info('Sample response for function1.')
    return {
        "message": "Your function executed successfully!",
        "event": event,
        "myconfig": myconfig['config_key']
    }
