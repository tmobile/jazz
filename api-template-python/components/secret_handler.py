# =========================================================================
# Copyright © 2017 T-Mobile USA, Inc.
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =========================================================================

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
