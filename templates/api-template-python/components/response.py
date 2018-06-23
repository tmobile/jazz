import json

class CustomResponse:

    def __init__(self, message, value):
        self.data = message
        self.input = value

    def get_json(self):
        print "#CustomResponse get_json", self.data, self.input
        obj = {
            'data': self.data,
            'input': self.input
        }
        return obj
