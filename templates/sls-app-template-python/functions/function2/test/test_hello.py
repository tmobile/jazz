import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


import main


def test():

    response = main.handler({}, None)
    assert response == {"message": "Your function executed successfully!", "event":{}}
