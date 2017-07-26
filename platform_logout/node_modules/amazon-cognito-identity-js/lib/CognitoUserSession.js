'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*!
 * Copyright 2016 Amazon.com,
 * Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Amazon Software License (the "License").
 * You may not use this file except in compliance with the
 * License. A copy of the License is located at
 *
 *     http://aws.amazon.com/asl/
 *
 * or in the "license" file accompanying this file. This file is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, express or implied. See the License
 * for the specific language governing permissions and
 * limitations under the License.
 */

/** @class */
var CognitoUserSession = function () {
  /**
   * Constructs a new CognitoUserSession object
   * @param {string} IdToken The session's Id token.
   * @param {string=} RefreshToken The session's refresh token.
   * @param {string} AccessToken The session's access token.
   */
  function CognitoUserSession() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        IdToken = _ref.IdToken,
        RefreshToken = _ref.RefreshToken,
        AccessToken = _ref.AccessToken;

    _classCallCheck(this, CognitoUserSession);

    if (AccessToken == null || IdToken == null) {
      throw new Error('Id token and Access Token must be present.');
    }

    this.idToken = IdToken;
    this.refreshToken = RefreshToken;
    this.accessToken = AccessToken;
  }

  /**
   * @returns {CognitoIdToken} the session's Id token
   */


  CognitoUserSession.prototype.getIdToken = function getIdToken() {
    return this.idToken;
  };

  /**
   * @returns {CognitoRefreshToken} the session's refresh token
   */


  CognitoUserSession.prototype.getRefreshToken = function getRefreshToken() {
    return this.refreshToken;
  };

  /**
   * @returns {CognitoAccessToken} the session's access token
   */


  CognitoUserSession.prototype.getAccessToken = function getAccessToken() {
    return this.accessToken;
  };

  /**
   * Checks to see if the session is still valid based on session expiry information found
   * in tokens and the current time
   * @returns {boolean} if the session is still valid
   */


  CognitoUserSession.prototype.isValid = function isValid() {
    var now = Math.floor(new Date() / 1000);

    return now < this.accessToken.getExpiration() && now < this.idToken.getExpiration();
  };

  return CognitoUserSession;
}();

exports.default = CognitoUserSession;