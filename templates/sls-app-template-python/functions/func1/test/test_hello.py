import json
import main


def test():

    response = main.handler({}, None)
    assert response == {"message": "Your function executed successfully!", "event":{}}
