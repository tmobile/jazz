import sys
import json
from library import requests


class SecretHandler:

    def decrypt_secret(self, secretMsg):
        payload_obj = secretMsg
        dec_payload = {}
        for key, val in payload_obj.items():
            if key != "config_key":
                dec_payload[key] = val

        if payload_obj.get('secret_id') == '':
            errorDetails = {
                "error": True,
                "message": "Secret_id not provided"
            }
            return errorDetails

        if payload_obj.get('cipher') == '':
            errorDetails = {
                "error": True,
                "message": "cipher not provided"
            }
            return errorDetails

        try:
            decryptRequest = requests.post('https://'
                                           'cloud-api.corporate.t-mobile.com/'
                                           'api/platform/'
                                           'decrypt-secret', data=dec_payload)
            decodedOutput = json.loads(decryptRequest.text)
            print decodedOutput
            if (decryptRequest.status_code == 200 and
                    decodedOutput.get('data').get('plain_text') is not None):
                    data = {
                        "message": decodedOutput.get('data').get('plain_text')
                    }
            else:
                data = {
                    "error": True,
                    "message": decodedOutput.get('message')
                }
            return data
        except requests.exceptions.RequestException as e:
            data = {
                "error": True,
                "message": e
            }
            return data
