'''
    Python Logging Component
    @module: logger.py
    @description: a simple logging module for python
    @author:
    @version: 1.0
'''

# import datetime
from datetime import datetime
import os
from inspect import currentframe, getframeinfo

'''
USAGE

    from components.logger import Logger
    logger = Logger(event, context)

    logger.warn('The following waring message will be logged');
    logger.verbose('The following waring message will not be logged')


    # Sample logging messages.
    logger.error('Runtime errors or unexpected conditions.');
    logger.warn('Runtime situations that are undesirable or unexpected,
     but not necessarily "wrong".');
    logger.info('Interesting runtime events (Eg. connection established,
     data fetched etc).');
    logger.verbose('Generally speaking, most lines logged by your applic
    ation should be written as verbose.');
    logger.debug('Detailed information on the flow through the system');

'''


class Logger(object):
    # init log_level, default config, context_details
    def __init__(self, event={}, context={}):
        self.log_levels = {
            'error': 4,
            'warn': 3,
            'info': 2,
            'verbose': 1,
            'debug': 0
        }
        self.config = {
            'cur_loglevel': 'info',
            'context_details': '',
            'show_timestamp': True,
            'show_linenumber': True
        }
        # self.logger     = logging.getLogger()
        # self.logger.set_level(logging.INFO)
        self.set_level()
        if context is not None:
            aws_request_id = None
            if isinstance(context, dict):
                aws_request_id = context.get('aws_request_id')
            else:
                aws_request_id = context.aws_request_id
            self.set_context_details('', aws_request_id)

        fname = self.set_context_details.__code__.co_filename
        self._srcfile = _srcfile = os.path.normcase(fname)

    # TODO: For future use, may be to add context information
    def set_context_details(self, label, value):
        # Timestamp and requestID are prepended in cloudwatch log by default;
        # If any other details are required it can be done here.
        if value is not None and value is not '':
            rd = self.config.get('context_details')
            if label is not None and label is not '':
                label = label + ': '
            rd = rd + str(label) + str(value) + '  '
            self.config['context_details'] = rd
        else:
            self.config['context_details'] = ''

    def print_file(self, fil):
        print self.get_linenumber()

    def get_linenumber(self):
        """
        Find the stack frame of the caller so that we can note the source
        file name, line number and function name.
        """
        f = currentframe()
        # On some versions of IronPython, currentframe() returns None if
        # IronPython isn't run with -X:Frames.
        if f is not None:
            f = f.f_back
        rv = "(unknown file): 0"
        while hasattr(f, "f_code"):
            co = f.f_code
            filename = os.path.normcase(co.co_filename)
            if filename == self._srcfile:
                f = f.f_back
                continue
            sinfo = None
            rv = str(co.co_filename) + ":" + str(f.f_lineno)
            break
        return rv

    # set current log_level
    # Only logs which are above the cur_loglevel will be logged;
    def set_level(self, level=None):
        # LOG_LEVEL is 'info' by default
        if level is not None and self.log_levels[level] is not None:
            # If LOG_LEVEL if explicitly specified , set it as the cur_loglevel
            self.config['cur_loglevel'] = level
            return level
        else:
            # Get LOG_LEVEL from the environment variables (if defined)
            try:
                import os
                level = os.environ.get('LOG_LEVEL')
            except Exception as e:
                self.error('error trying to access LOG_LEVEL')
                raise e

            if level is not None and self.log_levels[level] is not None:
                self.config['cur_loglevel'] = level
                return level
        return

    def log(self, level, message):
        # format message as required.

        if self.config.get('show_timestamp'):
            # timestamp = str(datetime.datetime.now()) + "  "
            timestamp = str(datetime.utcnow().strftime(
                             '%Y-%m-%dT%H:%M:%S.%f')[:-3] + "Z  ")
        else:
            timestamp = ""

        if self.config.get('show_linenumber') is True:
            linenumber = self.get_linenumber() + "  "
        else:
            linenumber = ""

        cur_loglevel = self.config.get('cur_loglevel')
        if self.log_levels[level] >= self.log_levels[cur_loglevel]:
            output_message = timestamp + \
                        self.config.get('context_details') + \
                        timestamp + str(level).upper() + "\t" + \
                        linenumber + \
                        message
            print(output_message)
        return

    def error(self, message):
        self.log('error', message)

    def warn(self, message):
        self.log('warn', message)

    def info(self, message):
        self.log('info', message)

    def verbose(self, message):
        self.log('verbose', message)

    def debug(self, message):
        self.log('debug', message)
