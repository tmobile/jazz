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
