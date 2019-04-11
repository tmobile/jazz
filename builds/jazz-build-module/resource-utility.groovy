#!groovy?
import groovy.transform.Field


@Field def configLoader


echo "resource util loaded successfully"

def initialize(configData){

    configLoader = configData

}

def configVarLookup(varKey, env) {

    //TODO we dont know how we will store the azure stuff in jazz installer var yet

}

def getResourceName(name, env) {
    if(env != "prod"){
        return "${name}${env}"
    } else {
        return name
    }
}


return this