#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput

def deletePolicies(serviceId, auth_token, aclUrl) {
	try {
		def body = JsonOutput.toJson([
			serviceId: serviceId,
			policies: []
		]);
		def updatePermission = sh(script: "curl POST \
				${aclUrl} \
				-k -v -H \"Authorization: $auth_token\" \
				-H \"Jazz-Service-ID: ${serviceId}\" \
				-H \"Content-Type: application/json\" \
				-d \'${body}\'", returnStdout: true).trim()
		def responseJSON = parseJson(updatePermission)

		if (responseJSON && responseJSON.data && responseJSON.data instanceof Object && responseJSON.data.success == true) {
			echo "Successfully deleted service policies."
		} else {
			echo "Something went wrong while deleting service policies. Error: ${responseJSON.data}"
			error responseJSON.data
		}
	} catch(ex) {
		echo "ex: $ex"
		error ex.getMessage()
	}
}

@NonCPS
def parseJson(jsonString) {
	def lazyMap = new groovy.json.JsonSlurperClassic().parseText(jsonString)
	def m = [:]
	m.putAll(lazyMap)
	return m
}

return this
