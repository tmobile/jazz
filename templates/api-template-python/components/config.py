# Python Template Project
# @Author:
# @version: 1.0

try:
    from configparser import ConfigParser
except ImportError:
    from ConfigParser import ConfigParser  # ver. < 3.0


class Config:

    def __init__(self, event):
        self.event = event

    @staticmethod
    def get_stage_file(self):
        stage = self.event.get('stage')
        conf = ConfigParser()
        # Add config variables in the respective config files
        # and they would be available in index handler.
        if stage == 'dev':
            conf.read('components/dev-config.ini')
        elif stage == 'stg':
            conf.read('components/stg-config.ini')
        else:
            conf.read('components/prod-config.ini')
        return conf

    def get_config(self, secretObj):
        config_obj = {}
        conf_file = self.get_stage_file(self)
        if conf_file.has_section(secretObj):
            for (key, val) in conf_file.items(secretObj):
                config_obj[key] = val
        return config_obj
