# =========================================================================
# Copyright 2017 T-Mobile USA, Inc.
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

# Python Template Project
# @Author:
# @version: 1.0


class CustomErrors():
    @staticmethod
    def throwInputValidationError(message):
        return CustomErrors.get_error_message("BadRequest", message)

    @staticmethod
    def throwForbiddenError(message):
        return CustomErrors.get_error_message("Forbidden", message)

    @staticmethod
    def throwUnauthorizedError(message):
        return CustomErrors.get_error_message("Unauthorized", message)

    @staticmethod
    def throwNotFoundError(message):
        return CustomErrors.get_error_message("NotFound", message)

    @staticmethod
    def throwInternalServerError(message):
        return CustomErrors.get_error_message("InternalServerError", message)

    @staticmethod
    def get_error_message(token, message):
        return '{"errorType": "%s", "message": "%s"}' % (token, message)
