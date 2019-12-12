# Python Template Project
# @Author:
# @version: 1.0

try:
    from configparser import ConfigParser
except ImportError:
    from ConfigParser import ConfigParser  # ver. < 3.0


class Config:

    def __init__(self, context):
        self.context = context

    @staticmethod
    def get_stage_file(self):
        function_name = self.context.function_name
        conf = ConfigParser()
        # Add config variables in the respective config files
        # and they would be available in index handler.
        if function_name.endswith("-dev"):
            conf.read('components/dev-config.ini')
        elif function_name.endswith("-stg"):
            conf.read('components/stg-config.ini')
        elif function_name.endswith("-prod"):
            conf.read('components/prod-config.ini')
        return conf

    def get_config(self, secretObj):
        config_obj = {}
        conf_file = self.get_stage_file(self)
        if conf_file.has_section(secretObj):
            for (key, val) in conf_file.items(secretObj):
                config_obj[key] = val
        return config_obj
