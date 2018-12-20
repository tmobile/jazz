#!groovy?
import groovy.json.JsonOutput

def updateAclPermission(serviceId, auth_token, aclUrl) {
	try {
		def categoryList = ['code', 'deploy']
		def policiesList = []
		for (category in categoryList) {
			def eachPolicy = [
				userId: service_config['created_by'],
				permission: 'write',
				category: category
			]
			policiesList.add(eachPolicy)
		}
		echo "policiesList: $policiesList"

		def body = JsonOutput.toJson([
			serviceId: serviceId,
			policies: policiesList
		]);
		def updatePermission = sh(script: "curl -X POST \
					${aclUrl} \
					-k -v -H \"Authorization: $auth_token\" \
					-H \"Content-Type: application/json\" \
					-d \'${body}\'", returnStdout: true).trim()
		def responseJSON = parseJson(updatePermission)

		if (responseJSON && responseJSON.success) {
			echo "Successfully updated permissions for code and deploy."
		} else {
			echo "Something went wrong while updating permissions for code and deploy."
		}
	} catch (ex) {
		echo "ex: $ex"
	}
}

return this
