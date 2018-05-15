#!groovy?
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import groovy.transform.Field
echo "Sonar code analyzer module loaded successfully"

/**
 * The Sonar module to run static code analysis - for JAVA, NodeJs & Python
*/

@Field def configLoader
@Field def g_sonar_enabled = false 
@Field def g_runtime_type = ""
@Field def g_sonar_projectKey = ""
@Field def g_sonar_projectName = ""
@Field def g_sonar_projectVersion = "1.0"
@Field def g_sonar_profile = ""
@Field def g_sonar_sources = "."
@Field def g_sonar_java_binaries = "target/"
@Field def g_sonar_host_url = ""
@Field def g_sonar_login = ""
@Field def g_sonar_password = ""
@Field def g_key_prefix = "jazz"
@Field def g_sonar_project_properties = [:]
@Field def g_isVSScanEnabled = false
@Field def g_dependencyCheckOutputFileName = "dependency-check-report.xml"
@Field def g_dependencyCheckNISTFilesLocation 
@Field def g_NISTDataMirrorUtility
@Field def g_dependencyCheckNumberOfHoursBeforeUpdate
@Field def g_dependency_check_properties = [:]

/**
 * Configure sonar and create the map for project specific sonar
 * properties
 *
 */
 def configureSonarProperties() {
	try {
		g_sonar_project_properties = [:]

		def sonar_projectKey = g_sonar_projectKey
		def sonar_projectName = g_sonar_projectName
		def sonar_projectVersion = g_sonar_projectVersion
		def sonar_sources = g_sonar_sources
		def sonar_profile = g_sonar_profile
		
		g_sonar_project_properties["sonar.projectKey"] = sonar_projectKey
		g_sonar_project_properties["sonar.projectName"] = sonar_projectName
		g_sonar_project_properties["sonar.projectVersion"] = sonar_projectVersion
		g_sonar_project_properties["sonar.sources"] = sonar_sources

		if (g_runtime_type.indexOf("java") > -1) {
			g_sonar_project_properties["sonar.java.binaries"] = g_sonar_java_binaries
		}

		if (sonar_profile.size() > 0) {
			g_sonar_project_properties["sonar.profile"] = sonar_profile
		}

		if (g_isVSScanEnabled) {
			g_sonar_project_properties["sonar.dependencyCheck.reportPath"] = g_dependencyCheckOutputFileName
		}

	} catch (ex) {
		error "configureSonarProperties Failed. "+ex.getMessage()
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
 
 def initialize(configData, service, domain, branch, runtime) {
	configLoader = configData;
	withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: configLoader.JENKINS.CREDENTIALS.SONAR, passwordVariable: 'PWD', usernameVariable: 'UNAME']]) {
		def host_name = "http://"+configLoader.CODE_QUALITY.SONAR.HOST_NAME
		setCredentials(host_name, UNAME, PWD) 
	}
	g_dependencyCheckNISTFilesLocation = configLoader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_FILES_LOCATION;
	g_NISTDataMirrorUtility = configLoader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_NIST_MIRROR_UTILITY;
	g_dependencyCheckNumberOfHoursBeforeUpdate = configLoader.CODE_QUALITY.SONAR.DEPENDENCY_CHECK_ELAPSED_HOURS_BEFORE_UPDATES;

	if(configLoader.CODE_QUALITY.SONAR.JAZZ_PROFILE) {
		g_sonar_profile =  configLoader.CODE_QUALITY.SONAR.JAZZ_PROFILE 
	}else{
		g_sonar_profile = ""
	}

	if( configLoader.CODE_QUALITY.SONAR.ENABLE_SONAR &&  configLoader.CODE_QUALITY.SONAR.ENABLE_SONAR == "true") {
		g_sonar_enabled = true
	}

	if( configLoader.CODE_QUALITY.SONAR.ENABLE_VULNERABILITY_SCAN && configLoader.CODE_QUALITY.SONAR.ENABLE_VULNERABILITY_SCAN == "true") {
		g_isVSScanEnabled = true
	}

	if(service && branch) {
		def projectKey = service+"_"+branch.replaceAll("/","-")
		if(domain) {
			projectKey = domain+"_"+projectKey
		}
		projectKey = g_key_prefix+"_"+projectKey

		setProjectKey(projectKey)
		setProjectName(projectKey)
		setRuntimeType(runtime)

	} else {
		error "Invalid project configurations for Sonar"
	}


 }

/**
 * Configure the credentials for Sonar
 *
 */
 def setCredentials(host, username, password) {
	if(host && username && password) {
		setHostUrl(host)
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
		def sonar_host_url = g_sonar_host_url
		def sonar_login = g_sonar_login
		def sonar_password = g_sonar_password
		sh "echo 'sonar.host.url=$sonar_host_url' >> /opt/sonar-scanner-3.0.3.778-linux/conf/sonar-scanner.properties"
		sh "echo 'sonar.login=$sonar_login' >> /opt/sonar-scanner-3.0.3.778-linux/conf/sonar-scanner.properties"
		def update_pwd_cmd = 'echo \'sonar.password='+sonar_password+'\' >> /opt/sonar-scanner-3.0.3.778-linux/conf/sonar-scanner.properties'
		jazz_quiet_sh(update_pwd_cmd)

	} catch (ex) {
		error "configureScanner Failed. "+ex.getMessage()
	}
 }

/**
 * Run the scanner for code analysis report based on the project settings
 *
 */
def runReport() {
	try {
		cleanUpWorkspace()
		
		def sonar_scanner_cl = "sonar-scanner "
		
		for(item in g_sonar_project_properties) {
			sonar_scanner_cl += " -D${item.key}=${item.value} "
		}

		sh sonar_scanner_cl
	}catch(ex) {
		error "runReport Failed. "+ex.getMessage()
	}
}

/**
 * Clean up the build workspace folder for fresh code analysis
 * docker instances will be reused based on availability which may come with build artifacts from
 * previous builds. 
 */
def cleanUpWorkspace() {
	if (g_runtime_type.indexOf("nodejs") > -1) {
		sh "rm -rf ./node_modules"
	} else if (g_runtime_type.indexOf("java") > -1) {
		sh "rm -rf ./target"
		sh "mvn compile"	
	} else if(g_runtime_type.indexOf("python") > -1) {
		sh "rm -rf ./library"
	}
	
}

/**
 * Configure and initiate code analyzer.
 */
def doAnalysis() {
	try{
		if(g_sonar_enabled) {
			configureScanner()
			configureSonarProperties()

			if (g_isVSScanEnabled) {
				runVulnerabilityScan()
			}

			runReport()	
		}
		
	} catch(ex) {
		error "Sonar Analysis Failed. "+ex.getMessage()
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
	sh "mkdir -p $g_dependencyCheckNISTFilesLocation"
	
	def isDirEmpty_cl = "[ -z \"\$(find $g_dependencyCheckNISTFilesLocation -maxdepth 1 -type f)\" ];"
	
	def downloadFiles_cl = " wget $g_NISTDataMirrorUtility -q -O nist-data-mirror.jar && java -jar nist-data-mirror.jar nist_files && mv nist_files/* $g_dependencyCheckNISTFilesLocation"
	sh "if $isDirEmpty_cl then $downloadFiles_cl; fi;"

	// run dependency check on the current dir
	sh "ls -al $g_dependencyCheckNISTFilesLocation"

	g_dependency_check_properties["project"] = g_sonar_projectKey
	g_dependency_check_properties["scan"] = "."
	g_dependency_check_properties["exclude"] = "**/*.zip"
	g_dependency_check_properties["out"] = "."
	g_dependency_check_properties["format"] = "XML"
	g_dependency_check_properties["cveUrl12Modified"] = "file://$g_dependencyCheckNISTFilesLocation/nvdcve-Modified.xml"
	g_dependency_check_properties["cveUrl20Modified"] = "file://$g_dependencyCheckNISTFilesLocation/nvdcve-2.0-Modified.xml"
	g_dependency_check_properties["cveUrl12Base"] = "file://$g_dependencyCheckNISTFilesLocation/nvdcve-%d.xml"
	g_dependency_check_properties["cveUrl20Base"] = "file://$g_dependencyCheckNISTFilesLocation/nvdcve-2.0-%d.xml"
	g_dependency_check_properties["cveValidForHours"] = g_dependencyCheckNumberOfHoursBeforeUpdate

	def dependency_check_cl = "dependency-check.sh "
	
	for(item in g_dependency_check_properties) {
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
		error "resetConfig Failed. "+ex.getMessage()
	}
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

/**
 * Set projectName
 * @return
 */

def setProjectName(projectName) {
	g_sonar_projectName = projectName

}


/**
 * Set Host URL
 * @return
 */

def setHostUrl(host) {
	g_sonar_host_url = host

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

/**
 * Set if Sonar to be enabled or not. This could be a param from the ENV
 * @return
 */

def setSonarEnabled(flag) {
	g_sonar_enabled = flag

}

/**
 * Set the runtime type
 * @return
 */

def setRuntimeType(runtime) {
	g_runtime_type = runtime

}

return this;
