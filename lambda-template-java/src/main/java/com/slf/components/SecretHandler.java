// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

package com.slf.components;

import com.amazonaws.services.lambda.runtime.Context;
import com.slf.util.EnvironmentConfig;
import com.slf.exceptions.BadRequestException;
import com.slf.exceptions.InternalServerErrorException;
import java.nio.charset.StandardCharsets;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.io.IOException;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import org.apache.log4j.Logger;

import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.amazonaws.services.lambda.runtime.RequestHandler;

import javax.net.ssl.HttpsURLConnection;

public class SecretHandler {
	private Context context;

	static final Logger logger = Logger.getLogger(SecretHandler.class);

	public SecretHandler(Context context) {
		this.context = context;
	}

	private HashMap<String,Object> parseResponse(String responseString) throws IOException {
		HashMap<String, Object> responseJson = new HashMap<String, Object>();
		ObjectMapper mapper = new ObjectMapper();
		responseJson = mapper.readValue(responseString, new TypeReference<HashMap<String, Object>>(){});
		return responseJson;
	} 

	private HashMap<String,Object> sendPost(String secret_url, String secret_json) throws Exception {
		Boolean done = false;
		HashMap<String,Object> data = new HashMap<String,Object>();
		HashMap<String, Object> result = new HashMap<String, Object>();

		URL obj = new URL(secret_url);
		HttpsURLConnection con = (HttpsURLConnection) obj.openConnection();

		// add reuqest header
		con.setRequestMethod("POST");
		con.setRequestProperty("Content-Type", "application/json");

		// Send post request
		con.setDoOutput(true);
		DataOutputStream wr = new DataOutputStream(con.getOutputStream());
		wr.writeBytes(secret_json);
		wr.flush();
		wr.close();

		// get response code
		int responseCode = con.getResponseCode();
		String responseString = "";
		HashMap<String, Object> responseJson = new HashMap<String, Object>();

		// read/parse response
		BufferedReader in = new BufferedReader(
				new InputStreamReader(con.getInputStream()));
		String inputLine;
		StringBuffer response = new StringBuffer();

		while ((inputLine = in.readLine()) != null) {
			response.append(inputLine);
		}
		in.close();

		responseString = response.toString();
		responseJson = parseResponse(responseString);
		
		logger.info(responseCode);
		logger.info(responseString);

		if (responseCode == 200) {
			HashMap<String, Object> responseData = (HashMap<String, Object>) responseJson.get("data");
			String plain_text_data = responseData.get("plain_text").toString();
			result.put("error",false);
			result.put("message",plain_text_data);
			return result;
		} else{
			String plain_text_data = responseJson.get("data").toString();
			throw new InternalServerErrorException(plain_text_data);
		}
	}

	public HashMap<String, Object> decryptSecret(String secret) {
		try{
			String plain_text_data, secret_id, cipher, secret_url;
			HashMap<String, Object> result = new HashMap<String, Object>();

			// Get decrypt-secret url from the properties file
			EnvironmentConfig configObject = null;
			try {
				configObject = new EnvironmentConfig(context);
				secret_url   = configObject.getConfig("decrypt_secret_url");
				logger.info("secret_url..:"+secret_url);
			} catch (Exception ex) {
				throw new InternalServerErrorException("Could not load env properties file "+ex.getMessage());
			}

			// validate secret
			if (secret == null || secret == "") {
				throw new InternalServerErrorException("Secret data is empty");
			}

			HashMap<String, Object> secret_encrypted;
			try{
				secret_encrypted = parseResponse(secret);
				logger.info("secret..:"+secret);
				secret_id = secret_encrypted.get("secret_id").toString();
				logger.info("secret_id..:"+secret_id);
				cipher = secret_encrypted.get("cipher").toString();
				logger.info("cipher..:"+cipher);
			} catch(Exception e){
				throw new InternalServerErrorException("Secret data is incorrect");
			}

			// validate secret_id
			if (secret_id == null || secret_id == "") {
				throw new InternalServerErrorException("Secret_id not provided");
			}

			// validate cipher
			if (cipher == null || cipher == "") {
				throw new InternalServerErrorException("cipher not provided");
			}
			
			// convert map to JSON string format
			ObjectMapper mapper = new ObjectMapper();
			String secret_json = "";

			Map<String, Object> map = new HashMap<String, Object>();
			map.put("secret_id", secret_id);
			map.put("cipher", cipher);
			secret_json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(map);

			HashMap<String,Object> secret_obj = sendPost(secret_url, secret_json);
			return secret_obj;
		} catch (Exception e) {
			logger.error("caught exception in method decryptSecret() ");
			logger.error(e);

			HashMap<String, Object> result = new HashMap<String, Object>();
			result.put("error",true);
			result.put("message",e.getMessage());
			return result;
		}
	}
}
