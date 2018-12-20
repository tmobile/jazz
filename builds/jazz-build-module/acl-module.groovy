#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

def deletePolicies(serviceId, auth_token, aclUrl) {
	try {
		def body = JsonOutput.toJson([
			serviceId: serviceId,
			policies: []
		]);
		def updatePermission = sh(script: "curl -X POST \
				${aclUrl} \
				-k -v -H \"Authorization: $auth_token\" \
				-H \"Content-Type: application/json\" \
				-d \'${body}\'", returnStdout: true).trim()
		def responseJSON = parseJson(updatePermission)

		if (responseJSON && responseJSON.success) {
			echo "Successfully deleted permissions."
		} else {
			echo "Something went wrong while deleting the permissions."
		}
	} catch(ex) {
		echo "ex: $ex"
	}
}

return this
