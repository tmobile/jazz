import sys
import os
import json

#sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
#sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .. import index

class DotDict(dict):
   pass

def test():

    context = DotDict()
    context.function_name = "jazztest_sls-app-python-FN_function2-envid-dev"
    response = index.handler({}, context)   
    assert response == {"message": "Your function executed successfully!", "event":{}, "myconfig": "config_val_dev-2"}
    