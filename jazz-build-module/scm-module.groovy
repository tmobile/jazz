#!groovy?
import groovy.json.JsonSlurperClassic
import groovy.json.JsonOutput
import groovy.transform.Field

/*
* Logic for crud operations involving scm data
*/

@Field def scm
@Field def gitlab_private_token
@Field def repo_base
@Field def scm_repo_name
@Field def username //naming convention seems confusing as this refers to an admin's account
@Field def password
@Field def cas_repo_id
@Field def repo_owner //this refers to the user's username
@Field def user_id
@Field def repo_loc
@Field def cas_rest_repo
@Field def cas_proj_id

echo "the scm-module has loaded successfully"

def initialize(scm, privateToken, repoBase, scmRepoName, username, password, repoOwner, cas_rest_repo){
  echo "setting intial values for scm-module"

  setScm(scm)
  setGitlabPrivateToken(privateToken)
  setRepoBase(repoBase)
  setScmRepoName(scmRepoName)
  setUsername(username)
  setPassword(password)
  setCasRepoId(cas_repo_id)
  setRepoOwner(repo_owner)
  setUserId(user_id)
  setRepoLoc(repo_loc)
  setCasRestRepo(cas_rest_repo)
}

def createProjectInSCM(){
	if(scm == "gitlab"){
		def private_token    = gitlab_private_token
		def git_username
		if(repo_owner.contains("@")){
			git_username = repo_owner.substring(0, owner.indexOf("@"))
		}
		def user_id = getGitlabUserId(git_username, private_token)
		def gitlab_repo_output = sh (
			script: "curl --header \"Private-Token: $gitlab_private_token\" -X POST \"http://$repo_base/api/v3/projects/user/$user_id?name=$scm_repo_name&path=$scm_repo_name&visibility=private&request_access_enabled=true\"",
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
  if(user_id == null || user_id.equals("")){
    def output = sh (
  		script: "curl --header \"Private-Token: $gitlab_private_token\" -X GET \"http://$repo_base/api/v3/users?username=$username\"",
  		returnStdout: true
  	).trim()
  	def jsonSlurper = new JsonSlurper()
  	def userObject = jsonSlurper.parseText(output)
    setUserId(userObject[0].id)
  	return userObject[0].id
  }
  else{
    return user_id
  }
}

def getCasRepoId(){
  if(cas_repo_id == null || cas_repo_id.equals("")){
    def output = sh (
  		script: "curl --header \"Private-Token: $gitlab_private_token\" -X GET \"http://$repo_base/api/v3/groups?search=$repo_loc\"",
  		returnStdout: true
  	).trim()
  	def jsonSlurper = new JsonSlurper()
  	def groupObject = jsonSlurper.parseText(output)
    setCasRepoId(groupObject[0].id)
  	return groupObject[0].id
  }
  else{
    return cas_repo_id
  }
}

def transferProject(cas_id, project_id){
	echo "transferring project to cas"

	def output = sh (
		script: "curl --header \"Private-Token: $gitlab_private_token\" -X POST \"http://$repo_base/api/v3/groups/$cas_id/projects/$project_id\"",
		returnStdout: true
	).trim()

	echo "project transferred to cas"
}

//JSON parser
@NonCPS
def parseJson(def json) {
    new groovy.json.JsonSlurperClassic().parseText(json)
}

//Setters Begin
def setScm(scmName){
  scm = scmName
}

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

def setCasRestRepo(casRestRepo){
  cas_rest_repo = casRestRepo
}
//Setters End

return this
