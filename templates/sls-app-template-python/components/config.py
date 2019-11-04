# Python Template Project
# @Author:
# @version: 1.0

import inspect
import os

try:
    from configparser import ConfigParser
except ImportError:
    from ConfigParser import ConfigParser  # ver. < 3.0


class Config:

    def __init__(self, context):
        self.context = context

    @staticmethod
    def get_stage_file(self, caller_module_path):
        function_name = self.context.function_name  

        conf = ConfigParser()
        # Add config variables in the respective config files
        # and they would be available in index handler.
        if function_name.endswith("-dev"):
            conf.read('%s/config/dev-config.ini' %(caller_module_path))
        elif function_name.endswith("-stg"):
            conf.read('%s/config/stg-config.ini' %(caller_module_path))
        elif function_name.endswith("-prod"):
            conf.read('%s/config/prod-config.ini' %(caller_module_path))

        return conf

    def get_config(self, section_key):
        caller_module_path = self.callingModule()
        config_obj = {}
        conf_file = self.get_stage_file(self, caller_module_path)
        if conf_file.has_section(section_key):
            for (key, val) in conf_file.items(section_key):
                config_obj[key] = val
       
        return config_obj

    #Get the caller Module
    def callingModule(self):
        stack = inspect.stack()
        getModule = stack[2]
        calling_module = inspect.getmodule(getModule[0])
        return os.path.abspath(os.path.dirname(calling_module.__file__))
