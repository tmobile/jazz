#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput

def updateServiceACL(serviceId, auth_token, aclUrl, user) {
	try {
		def categoryList = ['manage','code', 'deploy']
		def policiesList = []

		for (category in categoryList) {
			def permission = 'write';
			if(category == 'manage') permission = 'admin'
			def eachPolicy = [
				userId: user,
				permission: permission,
				category: category
			]
			policiesList.add(eachPolicy)
		}
		echo "policiesList: $policiesList"

		def body = JsonOutput.toJson([
			serviceId: serviceId,
			policies: policiesList
		]);
		def updatePermission = sh(script: "curl POST \
					${aclUrl} \
					-k -v -H \"Authorization: $auth_token\" \
					-H \"Content-Type: application/json\" \
					-d \'${body}\'", returnStdout: true).trim()
		def responseJSON = parseJson(updatePermission)

		if (responseJSON && responseJSON.data && responseJSON.data.success == true) {
			echo "Successfully updated permissions for code and deploy."
		} else {
			echo "Something went wrong while updating permissions for code and deploy."
		}
	} catch (ex) {
    echo "ex: $ex"
  }
}

def deletePolicies(serviceId, auth_token, aclUrl) {
	try {
		def body = JsonOutput.toJson([
			serviceId: serviceId,
			policies: []
		]);
		def updatePermission = sh(script: "curl POST \
				${aclUrl} \
				-k -v -H \"Authorization: $auth_token\" \
				-H \"Content-Type: application/json\" \
				-d \'${body}\'", returnStdout: true).trim()
		def responseJSON = parseJson(updatePermission)

		if (responseJSON && responseJSON.data && responseJSON.data.success == true) {
			echo "Successfully deleted permissions."
		} else {
			echo "Something went wrong while deleting the permissions."
		}
	} catch(ex) {
		echo "ex: $ex"
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
