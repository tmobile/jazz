import json

class CustomResponse:

    def __init__(self, message, value):
        self.data = message
        self.input = value

    def get_json(self):
        obj = {
            'data': self.data,
            'input': self.input
        }
        return obj
