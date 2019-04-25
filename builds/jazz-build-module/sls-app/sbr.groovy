/** The function traverses through the original user application.yml file that is represented as a Map and applies the rules from the rules file for every clause found in the user input.
    It returns a resulting Map that can immediatelly be serialized into the yml file and written to disk. config and context are also needed to resolve some values from the application yml
    @origAppYmlFile - the file in serverless serverless.yml format () as defined by a user/developer and parsed by SnakeYml (https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/)
    @rulesYmlFile - the Map representation of serverless-build-rules.yml parsed by org.yaml.snakeyaml.Yaml
    @config - the Map of configs like ["service_id": "4a053679-cdd4-482a-a34b-1b83662f1e81", service: "very_cool_service", domain: "some_domain" ...]
    @context - the context values that are map like: ["INSTANCE_PREFIX": "slsapp19"]
    @return - the resulting set represents the serverless.yml in org.yaml.snakeyaml.Yaml format

    To test please uncomment the comments at the bottom of the file and provide the good values to the simple serverless.yml file and to the serverless-build-rules.yml that you can locate inside jenkins-build-sls-app project
    You can run the application in any groovy enabled environment like groovyConsole for example
*/
Map<String, Object> processServerless(Map<String, Object> origAppYmlFile,
                                      Map<String, Object> rulesYmlFile,
                                      Map<String, String> config,
                                      Map<String, String> context) {

 // Loading and parsing all the rules to be presented in easily discoverable and executable form as map like [path:rule] i.e. [/service/name:SBR_Rule@127eae33, /service/awsKmsKeyArn:SBR_Rule@7e71274c, /frameworkVersion:SBR_Rule@5413e09 ...
    Map<String, SBR_Rule> rules =  collector(rulesYmlFile, "") // collector is the function that will return the map of enclosed map due to it rucursive nature
                                                            .flatten() // so flatten is needed to convert this tree like structure into the map like [[/service/name:SBR_Rule@127eae33], [/service/awsKmsKeyArn:SBR_Rule@7e71274c], ...]
                                                            .inject([:]){acc, item -> item.each{entry -> acc.put(entry.key, entry.value)};  return acc} // Now the reduce step is needed to convert all the sub-maplets into one big convenient map
    Transformer transformer = new Transformer(config, context, rules); // Encapsulating the config, context and rules into the class so that they do not have to be passed as an arguments with every call of recursive function

    return transformer.transform(origAppYmlFile);
}

/* This class encapsulates config, context and rules so that they don't have to be carried over with every call of recursive function */
class Transformer {
  private Map<String, String> config;
  private Map<String, String> context;
  private Map<String, SBR_Rule> rules;

  public Transformer(aConfig, aContext, aRules) {
    config = aConfig;
    context = aContext;
    rules = aRules;
  }

  private SBR_Rule ruleMatcher(aPathRules, aRules) {
    return aRules[aPathRules]
  }

  private def processor(aSubTree, currentPath) {
    if(!(aSubTree instanceof List || aSubTree instanceof Map)) {
      SBR_Rule theRule = ruleMatcher(currentPath, rules);
      if(theRule != null) {
        return theRule.applyRule(aSubTree, currentPath, config, context)
      } else {
        return aSubTree
      }
    } else {
      if(aSubTree instanceof Map) return aSubTree.inject([:]){acc, item -> acc.put(item.key, processor(item.value, currentPath+"/"+item.key) ); return acc}
      else return aSubTree.collect{val -> processor(val, currentPath)}.flatten()
    }
}

  public def transform(Map<String, Object> originalServerless) {
    return processor(originalServerless, "")
  }

}

/* The interface to generailize all type validations */
interface TypeValidator {
  void isValid(String aValue)
}

/*The simples example of type validation all others must be repeated after this example */
class IntValidator implements TypeValidator {
  public void isValid(String aValue) {
    try {
      Integer.parseInt(aValue)
    } catch(e) {
      throw new IllegalArgumentException(aValue, e);
    }
  }
}

/* Enum that must enlist all the types from serverless-build-rules.yml file. TODO: The lists and maps must be dealt with properly */
enum SBR_Type {

   INT("int", new IntValidator()),
   BOOL("bool", null), // TODO Must provide a validator
   STR("str", null),  // TODO Must provide a validator
   ENUM("enum", null),  // TODO Must provide a validator

   ARN_KMS("arn-kms", null),  // TODO Must provide a validator
   ARN_IAM("arn-iam", null),  // TODO Must provide a validator
   AWS_ID("aws-id", null),  // TODO Must provide a validator
   AWS_ARTIFACT_NAME("aws-artifact-id", null),  // TODO Must provide a validator
   AWS_VAR_NAME("aws-var-name", null),  // TODO Must provide a validator
   AWS_BUCKET_NAME("aws-bucket-name", null),  // TODO Must provide a validator
   AWS_TAG_VAL("aws-tag-val", null),  // TODO Must provide a validator
   PATH("path", null),  // TODO Must provide a validator
   AWS_VAR_VALUE("aws-var-value", null), // TODO Must provide a validator
   FUNCTION("function", null),  // TODO Must provide a validator
   EVENT("event", null),  // TODO Must provide a validator
   RESOURCE("resource", null),  // TODO Must provide a validator
   AWS_POLICY("aws-policy", null),  // TODO Must provide a validator
   MAP("[:]", null),  // TODO Must provide a validator
   LIST("[]", null),  // TODO Must provide a validator
   SEQUENCE("sequence", null)  // TODO Must provide a validator

   String tagValue
   TypeValidator typeValidator

   public SBR_Type(aTagValue, aValidator) {
     tagValue = aTagValue
     typeValidator = aValidator
   }

   public void validate(aValue) {
     if(typeValidator != null) typeValidator.isValid(aValue)
// TODO We have to implement all the validators and then re-instate the following statement here: "else throw new IllegalStateException("No validator is not set for: $tagValue")"
   }

   static final SBR_Type getByTagValue(String aTagValue) {
     if(aTagValue.contains("[")) {
       if(aTagValue.contains(":")) return MAP
       else return LIST
     }

     switch(aTagValue) {
       case "int" : return INT
       case "bool": return BOOL
       case "str": return STR
       case "enum": return ENUM
       case "arn-kms": return ARN_KMS
       case "arn-iam": return ARN_IAM
       case "aws-id": return AWS_ID
       case "aws-artifact-id": return AWS_ARTIFACT_NAME
       case "aws-artifact-name": return AWS_ARTIFACT_NAME
       case "aws-var-name": return AWS_VAR_NAME
       case "aws-bucket-name": return AWS_BUCKET_NAME
       case "aws-tag-val": return AWS_TAG_VAL
       case "path": return PATH
       case "function": return FUNCTION
       case "event": return EVENT
       case "resource": return RESOURCE
       case "aws-policy": return AWS_POLICY
       case "sequence": return SEQUENCE
       default: throw new IllegalArgumentException("[SBR_Type] Unknown tagValue: "+aTagValue)
    }
   }

}

/* Resolves value in accordance with render policy. */
interface Resolver {
  Object resolve(Object userVal, Object configVal)
}

class UserWinsResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal) {
// TODO: Put the log entry with both user and config values here
    return userVal
  }
}

class UserOnlyResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal) {
    return userVal
  }
}

class ConfigWinsResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal) {
// TODO: Put the log entry with both user and config values here
    return configVal
  }
}

class ConfigOnlyResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal) {
    return configVal
  }
}

enum SBR_Render {
  USER_WINS("user-wins", new UserWinsResolver()),
  CONFIG_WINS("config-wins", new ConfigWinsResolver()),
  USER_ONLY("user-only", new UserOnlyResolver()),
  CONFIG_ONLY("config-only", new ConfigOnlyResolver()),
  EXCEPTION_ON_MISMATCH("exception-on-mismatch", null), // TODO: Write a resolver
  MERGE("merge", null) // TODO: Write a resolver

  private String tagValue
  private Resolver resolver

  public SBR_Render(aTagValue, aResolver) {
    tagValue = aTagValue
    resolver = aResolver
  }

  public Object resolve(userVal, configVal) {
    if(resolver != null) return resolver.resolve(userVal, configVal)
    else throw new IllegalStateException("The resolver is not set for $tagValue")
  }

  static final SBR_Render getByTagValue(aTagValue) {
    switch(aTagValue) {
      case "user-wins": return USER_WINS;
      case "config-wins": return CONFIG_WINS;
      case "user-only": return USER_ONLY;
      case "config-only": return CONFIG_ONLY;
      case "exception-on-mismatch": return EXCEPTION_ON_MISMATCH;
      case "merge": return MERGE;
      default: throw new IllegalArgumentException("[SBR_Render] Unknown tagValue: "+aTagValue)
    }
  }

}

// Generalizes all constraints
interface SBR_Constraint {
  boolean compliant(val)
}

class SBR_Composite_Constraint implements SBR_Constraint {
  private List<SBR_Constraint> constraintList = new ArrayList<>();

  static final SBR_Constraint parseTag(tag) {
    SBR_Constraint cumulativeConstr = new SBR_Composite_Constraint();
    tag.collect{key, value ->
      switch(key) {
        case "sbr-enum": cumulativeConstr.constraintList.add(new SBR_Enum_Constraint(value)); break;
        case "sbr-from": cumulativeConstr.constraintList.add(new SBR_From_Constraint(value)); break;
        case "sbr-to": cumulativeConstr.constraintList.add(new SBR_To_Constraint(value)); break;
        case "sbr-whitelist": cumulativeConstr.constraintList.add(new SBR_To_Constraint([:], value)); break; // TODO real whitelist loaded needed here instead of an empty map
        default: throw new IllegalStateException("sbr-constraint contains an unknown tag inside as follows: $key")
      }
    }
    return cumulativeConstr
  }

  public boolean compliant(val) {
    return !constraintList.any{elem -> !elem.compliant(val)};
  }


}

class SBR_Enum_Constraint implements SBR_Constraint {
  public SBR_Enum_Constraint(inputEnum) {
  }

  public boolean compliant(val) { // TODO: Write a good validator
    return true;
  }
}

class SBR_Whitelist_Constraint implements SBR_Constraint {
  private def whitelist;
  private String elementPointer

  public SBR_Whitelist_Constraint(aWhitelist, anElementPointer) {
     whitelist = aWhitelist
     elementPointer = anElementPointer
  }

  public boolean compliant(val) { // TODO: Write a good validator
    return true;
  }
}

class SBR_To_Constraint implements SBR_Constraint {
  private int toValue

  public SBR_To_Constraint(int aToValue) {
    toValue = aToValue;
  }

  public boolean compliant(val) {
    return val <= toValue;
  }

}

class SBR_From_Constraint implements SBR_Constraint {
  public SBR_From_Constraint(int inputVal) {
  }

  public boolean compliant(val) { // TODO: Write a good validator
    return true;
  }
}

// Encapsulates formulas and default values
interface SBR_Value {
  Object renderValue(config, context)
}

class SBR_Example_Value implements SBR_Value {
  private def value;

  public SBR_Example_Value(aValue) {
    value = aValue;
  }

  public renderValue(config, context) {
    return value;
  }
}

class SBR_Formula_Value implements SBR_Value {
  private def formula

  static final SBR_Value parseTag(aValueTag) {
    if(aValueTag["sbr-formula"] != null) {
      return new SBR_Formula_Value(aValueTag["sbr-formula"])
    } else {
      throw new IllegalStateException("The formula is expected under the value tag for now")
    }
  }

  public SBR_Formula_Value(aFormula) {
    formula = aFormula
  }

  public renderValue(aConfig, aContext) {
    def sharedData = new Binding()
    def shell = new GroovyShell(sharedData)

    sharedData.setProperty('config', aConfig)
    sharedData.setProperty('configLoader', aContext)

    String result = shell.evaluate('"'+formula+'"') // TODO Investigate what to do with an exception here

    return result;
  }

  public String toString() {
    return "formula: $formula" ;
  }
}

class SBR_Rule {
   SBR_Type type
   SBR_Render render
   boolean isPrimary
   SBR_Constraint constraint
   SBR_Value value

   public SBR_Rule(SBR_Type aType,
                   SBR_Render aRender,
                   boolean aIsPrimary,
                   SBR_Constraint aConstraint,
                   SBR_Value aValue) {
     type = aType
     render = aRender
     isPrimary = aIsPrimary
     constraint = aConstraint
     value = aValue
   }

   public Object applyRule(userValue, path, config, context) {
     def valueRendered = (value != null) ? value.renderValue(config, context) : userValue;
     def theValue = render.resolve(userValue, valueRendered)
     type.validate(theValue); // This will raise the exception if type is wrong but we shave to suppliment it with path so TODO is to catch the exceotion then add the path and the re-throw it
     if(constraint != null && !constraint.compliant(theValue)) {
       throw new IllegalStateException("Constraint violated at the path $path with the value: $theValue")
     }
     return theValue
   }

   public String toString() {
     return "type: $type \n"+
            "render: $render \n"+
            "isPrimary: $isPrimary \n"+
            "value: $value \n\n";
   }
}


// Those below are stray functions now TODO: May need to move them into a separate class to encapsulate
boolean isLeaf(Object aTag) {
  return aTag instanceof Map && aTag.get("sbr-type") != null
}

SBR_Rule extractLeaf(Map<String, Object> aTag) {
  SBR_Type type = SBR_Type.getByTagValue(aTag["sbr-type"]);
  SBR_Render render = SBR_Render.getByTagValue(aTag["sbr-render"]);
  SBR_Constraint constraint = null;
  def constraintTag = aTag["sbr-constraint"]
  if(constraintTag != null) {
    constraint = SBR_Composite_Constraint.parseTag(constraintTag)
  }
  SBR_Value value = null;

  def valueTag = aTag["sbr-value"]
  if(valueTag != null) {
    if(valueTag["sbr-formula"] != null) value = SBR_Formula_Value.parseTag(valueTag) // Only Formula tag is implemented for now this if shall go away eventully
  }
  return new SBR_Rule(type, render, false, constraint, value);

}

def collector(arg, currentPath) {
  if(isLeaf(arg)) return [(new String(currentPath)) : extractLeaf(arg)]

  if(arg instanceof Map) return arg.collect{key, val -> collector(val, currentPath+"/"+key)}
  else return arg.collect{val -> collector(val, currentPath)}
}

/*
println ">>>>>>>>>>>>>>>>>>>>>>>>>"

@Grab('org.yaml:snakeyaml:1.17')
import org.yaml.snakeyaml.Yaml
parser = new Yaml()

config = ["service_id": "4a053679-cdd4-482a-a34b-1b83662f1e81",
              "service": "olegservice28",
              "domain": "olegdomain28",
              "created_by": "admin",
              "type":"sls-app",
              "runtime":"nodejs8.10",
              "region":"us-west-2b"]

context =  ["INSTANCE_PREFIX": "slsapp19"]

Map<String, Object> initialSmallServerless = parser.load(new File("/Users/olegfomin/verysmallserverless.yml").text) // Here provide a path to overly simplistic serverless.yml like
//service:
//  name: myService
//  awsKmsKeyArn: arn:aws:kms:us-east-1:XXXXXX:key/some-hash
Map<String, Object> sbrContent = parser.load(new File("/Users/olegfomin/rajeev/jenkins-build-sls-app/serverless-build-rules.yml").text) // Here provide a path to your serverless-build-rules.yml

Map<String, Object> resultingServerless = processServerless(initialSmallServerless, sbrContent, config, context)
*/
