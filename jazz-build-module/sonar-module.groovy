#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field
import java.util.regex.*

echo "Sonar code analyzer module loaded successfully"

/**
 * The Sonar module to run static code analysis - for JAVA, NodeJs & Python
*/

@Field def config_loader
@Field def service_config
@Field def g_branch
@Field def g_sonar_projectKey = ""
@Field def g_sonar_projectVersion = "1.0"
@Field def g_sonar_sources = "."
@Field def g_sonar_java_binaries = "target/"
@Field def g_sonar_login = ""
@Field def g_sonar_password = ""
@Field def g_sonar_project_properties
@Field def g_dependencyCheckOutputFileName = "dependency-check-report.xml"
@Field def g_dependency_check_properties = [:]

/**
 * Configure sonar and create the map for project specific sonar
 * properties
 *
 */
def configureSonarProperties() {
	try {
		g_sonar_project_properties = [:]

		if (service_config['service'] && g_branch) {
			def projectKey = service_config['service'] + "_" + g_branch.replaceAll("/", "-")
			if (service_config['domain']) {
				projectKey = service_config['domain'] + "_" + projectKey
			}
			projectKey = "${config_loader.CODE_QUALITY.SONAR.KEY_PREFIX}_${projectKey}"
			setProjectKey(projectKey)
		} else {
			error "Invalid project configurations for Sonar"
		}
		g_sonar_project_properties["sonar.projectKey"] = g_sonar_projectKey
		g_sonar_project_properties["sonar.projectName"] = g_sonar_projectKey
		g_sonar_project_properties["sonar.projectVersion"] = g_sonar_projectVersion
		g_sonar_project_properties["sonar.sources"] = g_sonar_sources

		if (service_config['runtime'].indexOf("java") > -1) {
			g_sonar_project_properties["sonar.java.binaries"] = g_sonar_java_binaries
		}

		if (config_loader.CODE_QUALITY.SONAR.JAZZ_PROFILE) {
			g_sonar_project_properties["sonar.profile"] = config_loader.CODE_QUALITY.SONAR.JAZZ_PROFILE
		}

		if (config_loader.CODE_QUALITY.SONAR.ENABLE_VULNERABILITY_SCAN && config_loader.CODE_QUALITY.SONAR.ENABLE_VULNERABILITY_SCAN == "true") {
			g_sonar_project_properties["sonar.dependencyCheck.reportPath"] = g_dependencyCheckOutputFileName
		}

	} catch (ex) {
		error "configureSonarProperties Failed. "+ ex.getMessage()
	}
}

/**
 * Initialization for static code analysis
 * @param configData - Configuration Data
 * @param service - Service name
 * @param domain - domain
 * @param branch - current branch being built
 * @param runtime - specify the service runtime
 */

def initialize(configLoader, serviceConfig, branch) {
	setServiceConfig(serviceConfig)
	setConfigLoader(configLoader)
	setBranch(branch)
	withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: config_loader.CODE_QUALITY.SONAR.ADMIN_SONAR_CREDENTIAL_ID, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
		setCredentials( UNAME, PWD)
	}
}

/**
 * Configure the credentials for Sonar
 *
 */
def setCredentials(username, password) {
	if (username && password) {
		setUserName(username)
		setPassword(password)
	} else {
		error "Not sufficient input for Sonar scanner configuration"
	}

}

/**
 * Configure the scanner
 * Update the sonar-scanner properties file with host, login credentials
 *
 */

def configureScanner() {
	try {
		def sonar_password = g_sonar_password
		sh "echo 'sonar.host.url=http://${config_loader.CODE_QUALITY.SONAR.HOST_NAME}' >> /opt/sonar-scanner-3.0.3.778-linux/conf/sonar-scanner.properties"
		sh "echo 'sonar.login=${g_sonar_login}' >> /opt/sonar-scanner-3.0.3.778-linux/conf/sonar-scanner.properties"
		def update_pwd_cmd = "echo 'sonar.password=${sonar_password}' >> /opt/sonar-scanner-3.0.3.778-linux/conf/sonar-scanner.properties"
		jazz_quiet_sh(update_pwd_cmd)
	} catch (ex) {
		error "configureScanner Failed. "+ ex.getMessage()
	}
}

/**
 * Run the scanner for code analysis report based on the project settings
 *
 */
def runReport() {
	try {
		cleanUpWorkspace()
		def sonar_scanner_cl = "sonar-scanner"
		for (item in g_sonar_project_properties) {
			sonar_scanner_cl += " -D${item.key}=${item.value} "
		}
		sh sonar_scanner_cl
	} catch (ex) {
		error "runReport Failed. "+ ex.getMessage()
	}
}

/**
 * Clean up the build workspace folder for fresh code analysis
 * docker instances will be reused based on availability which may come with build artifacts from
 * previous builds. 
 */
def cleanUpWorkspace() {
	if (service_config['runtime'].indexOf("nodejs") > -1) {
		sh "rm -rf ./node_modules"
	} else if (service_config['runtime'].indexOf("java") > -1) {
		sh "rm -rf ./target"
		sh "mvn compile"	
	} else if (service_config['runtime'].indexOf("python") > -1) {
		sh "rm -rf ./library"
	}

}

/**
 * Configure and initiate code analyzer.
 */
def doAnalysis() {
	try {
		if (config_loader.CODE_QUALITY.SONAR.ENABLE_SONAR && config_loader.CODE_QUALITY.SONAR.ENABLE_SONAR == "true") {
			configureScanner()
			configureSonarProperties()
			if (config_loader.CODE_QUALITY.SONAR.ENABLE_VULNERABILITY_SCAN && config_loader.CODE_QUALITY.SONAR.ENABLE_VULNERABILITY_SCAN == "true") {
				runVulnerabilityScan()
			}
			runReport()
		}

	} catch (ex) {
		error "Sonar Analysis Failed. "+ ex.getMessage()
	}
	finally {
		resetConfig() //**reset the credentials if there is a failure
	}
}

/**
Setup, configure and run dependency-check
*/
def runVulnerabilityScan() {
	// create dir if not exists
	sh "mkdir -p ${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION}"
	
	def isDirEmpty_cl = "[ -z \"\$(find ${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION} -maxdepth 1 -type f)\" ];"

	def downloadFiles_cl = " wget ${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_MIRROR_UTILITY} -q -O nist-data-mirror.jar && java -jar nist-data-mirror.jar nist_files && mv nist_files/* ${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION}"
	sh "if $isDirEmpty_cl then $downloadFiles_cl; fi;"

	// run dependency check on the current dir
	sh "ls -al ${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION}"

	g_dependency_check_properties["project"] = g_sonar_projectKey
	g_dependency_check_properties["scan"] = "."
	g_dependency_check_properties["exclude"] = "**/*.zip"
	g_dependency_check_properties["out"] = "."
	g_dependency_check_properties["format"] = "XML"
	g_dependency_check_properties["cveUrl12Modified"] = "file://${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION}/nvdcve-Modified.xml"
	g_dependency_check_properties["cveUrl20Modified"] = "file://${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION}/nvdcve-2.0-Modified.xml"
	g_dependency_check_properties["cveUrl12Base"] = "file://${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION}/nvdcve-%d.xml"
	g_dependency_check_properties["cveUrl20Base"] = "file://${config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION}/nvdcve-2.0-%d.xml"
	g_dependency_check_properties["cveValidForHours"] = config_loader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_ELAPSED_HOURS_BEFORE_UPDATES

	def dependency_check_cl = "dependency-check.sh "

	for (item in g_dependency_check_properties) {
		dependency_check_cl += " --${item.key} ${item.value} "
	}

	sh dependency_check_cl
}

/**
 * Reset the configuration file
 *
 */
def resetConfig() {
	try {
		sh "echo '' > /opt/sonar-scanner-3.0.3.778-linux/conf/sonar-scanner.properties"
		sh "echo '' > ./sonar-project.properties"
	} catch (ex) {
		error "resetConfig Failed. "+ ex.getMessage()
	}
}

def cleanupCodeQualityReports(){
	try {
		def cleanupList = getSonarProject()
		def cleanedupListStr = cleanupList.join(',');
		def creds = "${config_loader.CODE_QUALITY.SONAR.USER_NAME}:${config_loader.CODE_QUALITY.SONAR.PASSWORD}"
		def token = creds.getBytes().encodeBase64().toString()
		def url = "${config_loader.CODE_QUALITY.SONAR.SONARQUBE_BASE_URL}/api/projects/bulk_delete?keys=${cleanedupListStr}"
		def response = sh(script: "curl -X POST \
					 ${url} \
					 -k -v -H \"Authorization: $token\" \
					 -H \"Content-Type: application/x-www-form-urlencoded\" ", returnStdout: true).trim()
		def responseJSON = parseJson(response)
		if (responseJSON.statusCode == 200 || responseJSON.statusCode == 204) {
			echo "Successfully cleaned the code quality reports from sonar. Please find the cleaned reports : ${cleanupList}"
		} else {
            error "error occured While deleting code quality reports: " + responseJSON.error.message
		}
	} catch (ex) {
		echo "error occured While deleting code quality reports: " + ex.getMessage()
		error ex.getMessage()
	}
}

def getSonarProject(){
	try {
		def project_key = "${config_loader.CODE_QUALITY.SONAR.KEY_PREFIX}_${service_config['domain']}_${service_config['service']}";
		def creds = "${config_loader.CODE_QUALITY.SONAR.USER_NAME}:${config_loader.CODE_QUALITY.SONAR.PASSWORD}"
		def token = creds.getBytes().encodeBase64().toString()
		def url = "${config_loader.CODE_QUALITY.SONAR.SONARQUBE_BASE_URL}/api/projects/index?search=${project_key}"
		def response = sh(script: "curl -X POST \
					 ${url} \
					 -k -v -H \"Authorization: $token\" \
					 -H \"Content-Type: application/x-www-form-urlencoded\" ", returnStdout: true).trim()

		def responseJSON = parseJson(response)
		def filtered = [];
		if (responseJSON) {
			for (data in responseJSON.body) {
				var pKey = data.k;
				echo "projectKey : ${pKey}" 
				var patternStr = "^${project_key}_(.*)";
				Matcher keyMatcher = Pattern.compile(patternStr).matcher(pKey);
				while (keyMatcher.find()) {
					filtered.push(pKey)
				}
			}
		}
		return filtered
	} catch (ex) {
		echo "error occured While fetching code quality reports from sonar : " + ex.getMessage()
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

/**
 * Jazz shebang that runs quietly and disable all console logs
 *
 */
def jazz_quiet_sh(cmd) {
    sh('#!/bin/sh -e\n' + cmd)
}

/**
 * Set projectKey
 * @return
 */

def setProjectKey(projectKey) {
	g_sonar_projectKey = projectKey

}

def setBranch(branch) {
	g_branch = branch
}

def setServiceConfig(serviceConfig){
	service_config = serviceConfig
}

def setConfigLoader(configLoader){
	config_loader = configLoader
}

/**
 * Set Username
 * @return
 */

def setUserName(login) {
	g_sonar_login = login
}

/**
 * Set Password
 * @return
 */

def setPassword(password) {
	g_sonar_password = password
}

return this;