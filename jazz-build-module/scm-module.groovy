#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* Logic for crud operations involving scm data
*/

@Field def gitlab_private_token
@Field def repo_base
@Field def scm_repo_name
@Field def username //naming convention seems confusing as this refers to an admin's account
@Field def password
@Field def cas_repo_id
@Field def repo_owner //this refers to the user's username
@Field def user_id
@Field def repo_loc

echo "the scm-module has loaded successfully"

def initialize(privateToken, repoBase, scmRepoName, username, password, repoOwner){
  echo "setting intial values for scm-module"

  setGitlabPrivateToken(privateToken)
  setRepoBase(repoBase)
  setScmRepoName(scmRepoName)
  setUsername(username)
  setPassword(password)
  setCasRepoId(cas_repo_id)
  setRepoOwner(repo_owner)
  setUserId(user_id)
  setRepoLoc(repo_loc)
}

def createProjectInSCM(gitlab_private_token, repo_base, scm_repo_name, username, password, cas_repo_id, repo_owner)
{
	if(scm == "gitlab"){
		def private_token    = gitlab_private_token
		def git_username
		if(owner.contains("@")){
			git_username = owner.substring(0, owner.indexOf("@"))
		}
		def user_id = getGitlabUserId(git_username, private_token)
		def gitlab_repo_output = sh (
			script: "curl --header \"Private-Token: $private_token\" -X POST \"http://$repo_base/api/v3/projects/user/$user_id?name=$scm_repo_name&path=$scm_repo_name&visibility=private&request_access_enabled=true\"",
			returnStdout: true
		).trim()

		def jsonSlurper = new JsonSlurper()
		def object = jsonSlurper.parseText(gitlab_repo_output)
		cas_proj_id = object.id

		transferProject(cas_repo_id, cas_proj_id)
	}
	else{
		sh "curl -X POST -k -v -u \"$username:$password\" -H \"Content-Type: application/json\" " + cas_rest_repo + " -d \'{\"name\":\""+ scm_repo_name +"\", \"scmId\": \"git\", \"forkable\": \"true\"}\'"
	}
}

def getGitlabUserId(username, private_token){
	def output = sh (
		script: "curl --header \"Private-Token: $private_token\" -X GET \"http://$repo_base/api/v3/users?username=$username\"",
		returnStdout: true
	).trim()
	def jsonSlurper = new JsonSlurper()
	def userObject = jsonSlurper.parseText(output)
	return userObject[0].id
}

def getCasRepoId(private_token){
	def output = sh (
		script: "curl --header \"Private-Token: $private_token\" -X GET \"http://$repo_base/api/v3/groups?search=$repo_loc\"",
		returnStdout: true
	).trim()
	def jsonSlurper = new JsonSlurper()
	def groupObject = jsonSlurper.parseText(output)
	return groupObject[0].id
}

def transferProject(cas_id, project_id){
	echo "transferring project to cas"

	def output = sh (
		script: "curl --header \"Private-Token: $private_token\" -X POST \"http://$repo_base/api/v3/groups/$cas_id/projects/$project_id\"",
		returnStdout: true
	).trim()

	echo "project transferred to cas"
}

//JSON parser
@NonCPS
def parseJson(def json) {
    new groovy.json.JsonSlurperClassic().parseText(json)
}

//Getters Begin

//Getters End

//Setters Begin

def setGitLabPrivateToken(privateToken){
  gitlab_private_token = privateToken
}

def setRepoBase(repoBase){
  repo_base = repoBase
}

def setScmRepoName(scmRepoName){
  scm_repo_name = scmRepoName
}

def setUsername(uname){
  username = uname
}

def setPassword(pw){
  password = pw
}

def setCasRepoId(casRepoId){
  cas_repo_id = casRepoId
}

def setRepoOwner(repoOwner){
  repo_owner = repoOwner
}

def setUserId(userId){
  user_id = userId
}

def setRepoLoc(repoLoc){
  repo_loc = repoLoc
}
//Setters End

return this
