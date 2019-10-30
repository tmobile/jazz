#!groovy?
import groovy.transform.Field
import org.json.*

@Field def whitelistValidator
@Field def sbrContent

echo "sbr.groovy is being loaded"

def output

def initialize(output,aWhitelistValidator) {
  this.output = output
  sbrContent = readFile("./sls-app/serverless-build-rules.yml")
  whitelistValidator = aWhitelistValidator
}


/** The function traverses through the original user serverless.yml file that is represented as a Map and applies the rules from the rules file for every clause found in the user input.
    It returns a resulting Map that can immediatelly be serialized into the yml file and written to disk. config and context are also needed to resolve some values from the application yml
    @origAppYmlFile - the file in serverless serverless.yml format () as defined by a user/developer and parsed by SnakeYml (https://serverless.com/framework/docs/providers/aws/guide/serverless.yml/)
    @rulesYmlFile - the Map representation of serverless-build-rules.yml parsed by org.yaml.snakeyaml.Yaml
    @config - the Map of configs like ["service_id": "4a053679-cdd4-482a-a34b-1b83662f1e81", service: "very_cool_service", domain: "some_domain" ...]
    @context - the context values that are map like: ["INSTANCE_PREFIX": "slsapp19"]
    @return - the resulting set represents the serverless.yml in org.yaml.snakeyaml.Yaml format

    To test please uncomment the comments at the bottom of the file and provide the good values to the simple serverless.yml file and to the serverless-build-rules.yml that you can locate inside jenkins-build-sls-app project
    You can run the application in any groovy enabled environment like groovyConsole for example
*/
def Map<String, Object> processServerless(Map<String, Object> origAppYmlFile,
                                          Map<String, Object> rulesYmlFile,
                                                              config,
                                          Map<String, String> context) {


 // Loading and parsing all the rules to be presented in easily discoverable and executable form as map like [path:rule] i.e. [/service/name:SBR_Rule@127eae33, /service/awsKmsKeyArn:SBR_Rule@7e71274c, /frameworkVersion:SBR_Rule@5413e09 ...
    Map<String, SBR_Rule> rules =  convertRuleForestIntoLinearMap(rulesYmlFile)
    Map<String, SBR_Rule> resolvedRules = rulePostProcessor(rules)

    Transformer transformer = new Transformer(output, config, context, resolvedRules) // Encapsulating the config, context and rules into the class so that they do not have to be passed as an arguments with every call of recursive function

    Map<String, Object> transformedYmlTreelet = transformer.transform(origAppYmlFile);
    Map<String, SBR_Rule> path2MandatoryRuleMap = resolvedRules.inject([:]){acc, item -> if(item.value instanceof SBR_Rule && item.value.isMandatory) acc.put(item.key, item.value); return acc}

    Map<String, Object> mandatoryYmlTreelet = retrofitMandatoryFields(path2MandatoryRuleMap, config, context, transformer)

    Map<String, Object> ymlOutput = merge(mandatoryYmlTreelet, transformedYmlTreelet) // Order of arguments is important here because in case of collision we want the user values to overwrite the default values

    return ymlOutput
}

def Map<String, String> allRules(Map<String, Object> origAppYmlFile,
                                 Map<String, Object> rulesYmlFile,
                                                     config,
                                 Map<String, String> context) {
 // Loading and parsing all the rules to be presented in easily discoverable and executable form as map like [path:rule] i.e. [/service/name:SBR_Rule@127eae33, /service/awsKmsKeyArn:SBR_Rule@7e71274c, /frameworkVersion:SBR_Rule@5413e09 ...
    Map<String, SBR_Rule> rules =  convertRuleForestIntoLinearMap(rulesYmlFile)
    Map<String, SBR_Rule> resolvedRules = rulePostProcessor(rules)

    return  resolvedRules.inject([:]){acc, item -> acc.put(item.key, item.value.toString()); return acc;}
}

/* This class encapsulates config, context and rules so that they don't have to be carried over with every call of recursive function */
class Transformer {
  // output is added here only to facilitate echo for easy debugging
  def output;
  private def config;
  private Map<String, String> context;
  private Map<String, SBR_Rule> path2RulesMap;
  private Map<String, SBR_Rule> templatedPath2RulesMap;
  private Map<String, SBR_Rule> path2MandatoryRuleMap;
  private Map<String, List> path2OrigRuleMap = [:];

  public Transformer(output, aConfig, aContext, aPath2RulesMap) {
    output = output
    output.echo("In Transformer Constructor! Test for Echo")
    config = aConfig;
    context = aContext;
    path2RulesMap = aPath2RulesMap;
    templatedPath2RulesMap = path2RulesMap.inject([:]){acc, item -> if(item.key.contains("*")) acc.put(item.key, item.value); return acc} // Copying all path-2-rule entries where a path contains '*' thus it is a template
  }

  boolean pathMatcher(String templatedPath, String targetPath) {
    String[] templatedPathSegments = templatedPath.split("/")
    String[] targetPathSegments = targetPath.split("/")
    if(templatedPathSegments.length != targetPathSegments.length) return false
    boolean acc = true
    targetPathSegments.eachWithIndex{seg, idx -> acc = (idx == 0 || seg.equals(templatedPathSegments[idx]) ||  templatedPathSegments[idx].contains("*")) & acc}
    return acc
  }

  List<String> resolveAsterisks(String templatedPath, String targetPath) {
    List<String> val2Ret = []
    if(!templatedPath.contains("*")) return val2Ret

    String[] templatedPathSegments = templatedPath.split("/")
    String[] targetPathSegments = targetPath.split("/")

    targetPathSegments.eachWithIndex{seg, idx -> if(templatedPathSegments[idx] == "*") val2Ret.add(targetPathSegments[idx])}

    if(path2OrigRuleMap[(templatedPath)] ) path2OrigRuleMap[(templatedPath)].add(targetPath)
    else path2OrigRuleMap[(templatedPath)] = new ArrayList(); path2OrigRuleMap[(templatedPath)].add(targetPath)

    return val2Ret
  }


  private SBR_Rule ruleMatcher(aPath) {
    SBR_Rule simpleMatch = path2RulesMap[aPath]
    if(simpleMatch != null) {
      return simpleMatch;
    } else {
      def path2rule = templatedPath2RulesMap.find{thePath2Rule -> pathMatcher(thePath2Rule.key, aPath)}
      if(path2rule == null) return null
      path2rule.value.asteriskValues = resolveAsterisks(path2rule.key, aPath)
      return path2rule.value
    }
  }

  private def processor(aSubTree, currentPath) {
    SBR_Rule theRule = ruleMatcher(currentPath);
    if(theRule != null) {
     return theRule.applyRule(aSubTree, currentPath, config, context)
    } else {
      if(aSubTree instanceof Map) return aSubTree.inject([:]){acc, item -> acc.put(item.key, processor(item.value, currentPath+"/"+item.key) ); return acc}
      else throw new IllegalStateException("Your application definition - serverless.yml contains a path `${currentPath}` that is not supported. Please refer to documentation for supported paths.")
    }
  }


  public def transform(Map<String, Object> originalServerless) {
    Map<String, Object> ymlOutput = processor(originalServerless, "")
    return ymlOutput
  }

}

/* The interface to generailize all type validations */
interface TypeValidator {
  void isValid(def aValue)
}

/*The simples example of type validation all others must be repeated after this example */
class IntValidator implements TypeValidator {
  public void isValid(def aValue) {
    try {
      Integer.parseInt(aValue)
    } catch(e) {
      throw new IllegalArgumentException("Invalid Integer: " + aValue + " is of type: " + aValue?.class);
    }
  }
}

class StringValidator implements TypeValidator {
  public void isValid(def aValue) {
    if(!aValue instanceof String)
    throw new IllegalArgumentException("Invalid String: " + aValue + " is of type: " + aValue?.class);
  }
}

class BooleanValidator implements TypeValidator {
  public void isValid(def aValue) {
    try {
      Boolean.parseBoolean(aValue)
    } catch(e) {
      throw new IllegalArgumentException("Invalid Boolean: " + aValue + " is of type: " + aValue?.class);
    }
  }
}

class EnumValidator implements TypeValidator {
  public void isValid(def aValue) {
    if(!aValue instanceof Enum)
    throw new IllegalArgumentException("Invalid Enum: " + aValue );
  }
}

class ListValidator implements TypeValidator {
  public void isValid(def aValue) {
    if(!aValue instanceof List)
     throw new IllegalArgumentException("Invalid List: " + aValue + " is of type: " + aValue?.class);
  }
}

class MapValidator implements TypeValidator {
  public void isValid(def aValue) {
    if(!aValue instanceof Map)
     throw new IllegalArgumentException("Invalid Map: " + aValue + " is of type: " + aValue?.class);
  }
}

class JsonValidator implements TypeValidator {
  public void isValid(def aValue) {
    if(!aValue instanceof JSONObject)
     throw new IllegalArgumentException("Invalid Json: " + aValue + " is of type: " + aValue?.class);
  }
}

class DeploymentStageNameValidator implements TypeValidator {
  public void isValid(def aValue) {
    if(!(aValue == "prod" || aValue == "stg" || aValue.endsWith("dev")))
    throw new IllegalArgumentException("Invalid stage : " + aValue );
  }
}

class SequenceValidator implements TypeValidator {
  public void isValid(def aValue) {
    if(!aValue instanceof List)
    throw new IllegalArgumentException("Invalid Sequence: " + aValue + " is of type: " + aValue?.class);
  }
}

class IamArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:iam::\\d{12}:role/?[a-zA-Z_0-9+=,.@\\-_/]+"
    def match = aValue ==~ pattern
    if(!match)
     throw new IllegalArgumentException("Invalid IAM Arn: " + aValue );
  }
}

class KmsArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:kms::\\d{12}:key/?[a-zA-Z_0-9+=,.@\\-_/]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid KMS Arn: " + aValue );
  }
}

class AwsIdValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^\\d{12}"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid AWS ID: " + aValue );
  }
}

class FunctionValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z_0-9+=,.@\\-_/]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Function: " + aValue );
  }
}

class PluginValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z0-9_.-]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Plugin :" + aValue)
  }
}

class ResourceValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Resource: " + aValue );
  }
}

class PolicyValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Policy Arn: " + aValue );
  }
}

class EventValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Event: " + aValue );
  }
}

class AwsVariableValueValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Aws variable value: " + aValue );
  }
}

class AwsVariableNameValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Aws variable name: " + aValue );
  }
}


class GenericArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def elements = aValue.split(":")
    if(elements.size() != 6)
    throw new IllegalArgumentException("Invalid Arn: " + aValue );
  }
}

class SnsArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:sns::\\d{12}:?[a-zA-Z_0-9+=,.@\\-_/]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid SNS Arn: " + aValue );
  }
}

class LayerArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:opsworks::\\d{12}:layer/?[a-zA-Z_0-9+=,.@\\-_/]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Layer Arn: " + aValue );
  }
}

class LambdaArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:lambda::\\d{12}:function:?[a-zA-Z0-9-_]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid SQS Arn: " + aValue );
  }
}

class SqsArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:sqs::\\d{12}:?[a-zA-Z0-9-_]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid SQS Arn: " + aValue );
  }
}

class IamPolicyArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:iam::\\d{12}:([user|group]+)\\/\\*"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Iam policy Arn: " + aValue );
  }
}

class KinesisArnValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^arn:aws:kinesis::\\d{12}:stream/?^[a-zA-Z0-9_.-]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Kinesis Arn: " + aValue );
  }
}

class AwsArtifactNameValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "[a-zA-Z0-9_\\-]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid artifact name: " + aValue );
  }
}

class AwsS3BucketNameValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "(?=^.{3,63})(?!^(\\d+\\.)+\\d+)(^(([a-z0-9]|[a-z0-9][a-z0-9\\-]*[a-z0-9])\\.)*([a-z0-9]|[a-z0-9][a-z0-9\\-]*[a-z0-9]))"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid S3 Bucket name: " + aValue );
  }
}

class AwsTagNameValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z_0-9+=,.@\\-_/+-=._:/ ]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid Tag name: " + aValue );
  }
}

class AwsScheduleRateValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "(cron|rate)?([()\\d\\?*, ]+)"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid schedule rate expression: " + aValue );
  }
}

class AwsPathValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z_0-9+.\\-_/. ]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid AWS path: " + aValue );
  }
}

class AwsPrincipleValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z_0-9+.\\-_/.*? ]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid AWS principle: " + aValue );
  }
}

class AwsDescriptionValidator implements TypeValidator {
  public void isValid(def aValue) {
    def pattern = "^[a-zA-Z_0-9+=,.@\\-_/+-=._:/ ]+"
    def match = aValue ==~ pattern
    if(!match)
    throw new IllegalArgumentException("Invalid AWS description: " + aValue );
  }
}

/* Enum that must enlist all the types from serverless-build-rules.yml file. TODO: The lists and maps must be dealt with properly */
enum SBR_Type {

   INT("int", new IntValidator()),
   BOOL("bool", new BooleanValidator()),
   STR("str", new StringValidator()),
   ENUM("enum", new EnumValidator()),
   JSON("json", new JsonValidator()),

   ARN("arn", new GenericArnValidator()),
   ARN_KMS("arn-kms", new KmsArnValidator()),
   ARN_IAM("arn-iam", new IamArnValidator()),
   AWS_ID("aws-id", new AwsIdValidator()),
   ARN_SNS("arn-sns", new SnsArnValidator()),
   ARN_LAYER("arn-layer", new LayerArnValidator()),
   ARN_LAMBDA("arn-lambda", new LambdaArnValidator()),
   ARN_SQS("arn-sqs", new SqsArnValidator()),
   ARN_IAM_POLICY("arn-iam-policy", new IamPolicyArnValidator()), // TODO Must provide a validator
   ARN_KINESIS("arn-kinesis", new KinesisArnValidator()),
   AWS_ARTIFACT_NAME("aws-artifact-name", new AwsArtifactNameValidator()),
   AWS_BUCKET_NAME("aws-bucket-name", new AwsS3BucketNameValidator()),
   AWS_TAG_VAL("aws-tag-value", new AwsTagNameValidator()),
   AWS_SCHEDULE_RATE("aws-schedule-rate", new AwsScheduleRateValidator()),
   PATH("path", new AwsPathValidator()),
   AWS_PRINCIPAL("aws-principal", new AwsPrincipleValidator()),
   AWS_DESCRIPTION("aws-description", new AwsDescriptionValidator()),
   AWS_VAR_VALUE("aws-var-value", new AwsVariableValueValidator()),
   AWS_VAR_NAME("aws-var-name", new AwsVariableNameValidator()),
   FUNCTION("function", new FunctionValidator()),
   PLUGIN("plugin", new PluginValidator()),
   EVENT("event", new EventValidator()),
   RESOURCE("resource", new ResourceValidator()),
   AWS_POLICY("aws-policy",  new PolicyValidator()), // TODO Must provide a validator
   DEPLOYMENT_STAGE("deployment-stage", new DeploymentStageNameValidator()),
   MAP("[:]", new MapValidator()),
   LIST("[]", new ListValidator()),
   SEQUENCE("sequence", new SequenceValidator())    // TODO Must provide a validator




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

     Map<String, SBR_Type> tagVal2TypeMap =  SBR_Type.values() // Lists all type enum values declared above
                                                     .collect{aType -> [(aType.tagValue) : aType]} // Making alist of maplets to persist both tagValue and the encompassing type together as a some form of tuple [ ["int":INT], ["bool":BOOL], ...]
                                                     .inject([:]){acc, item -> item.each{entry -> acc.put(entry.key, entry.value)}; return acc} // Transforming the list of maplets into one convenient map that help us to resolve the type by tagValue provided ["int":INT, "bool":BOOL, ..., "aws_bucket_name": AWS_BUCKET_NAME, ...]

     SBR_Type theType = tagVal2TypeMap[aTagValue]
     if(theType == null) throw new IllegalArgumentException("[SBR_Type] Unknown tagValue: "+aTagValue)

     return theType

   }

}

// In case the type is a map or list we have to preserve the argument types inside the list or map
class SBR_Type_Descriptor {
  SBR_Type type
  List<SBR_Type> underlyingTypeList

  public SBR_Type_Descriptor(aType, anUnderlyingTypeList) {
    type = aType
    underlyingTypeList = anUnderlyingTypeList
  }

  public boolean isMap() {
    return type == SBR_Type.MAP
  }

  public boolean isList() {
    return type == SBR_Type.LIST
  }

  public SBR_Type getType() {
    return type
  }

  public List<SBR_Type> getUnderlyingTypeList() {
    return underlyingTypeList
  }

  static final SBR_Type_Descriptor parseTag(aTag) {
     String typeExtracted = aTag["sbr-type"]
     SBR_Type type = SBR_Type.getByTagValue(typeExtracted);
     switch(type) {
       case SBR_Type.LIST:
         String underlyingTypeAsString = typeExtracted.replace("[","").replace("]","")
         SBR_Type underlyingType = SBR_Type.getByTagValue(underlyingTypeAsString)
         return new SBR_Type_Descriptor(type, [underlyingType]);
       case SBR_Type.MAP:
         String twoUnderlyingTypesAsString = typeExtracted.replace("[","").replace("]","")
         String[] underlyingTypesAsString = twoUnderlyingTypesAsString.split(":")
         return new SBR_Type_Descriptor(type, [SBR_Type.getByTagValue(underlyingTypesAsString[0]), SBR_Type.getByTagValue(underlyingTypesAsString[1])]);
       default: return new SBR_Type_Descriptor(type, [])
     }
  }

  String toString() {
    return "SBR_Type_Descriptor{type:"+type+"; underlyingTypeList="+underlyingTypeList+"}"
  }

  public void validate(aValue) {
    if (!underlyingTypeList.contains(aValue))
    {
      // TODO for now we are not throwing this exception as the validation implementation is incomplete
      // throw new IllegalStateException("The following type is not supported: $aValue Supported types are: ${underlyingTypeList}")
    }
  }
}

/* Resolves value in accordance with render policy. */
interface Resolver {
  Object resolve(Object userVal, Object configVal, Object defaultValue)
}

class UserWinsResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal, Object defaultValue) {
// TODO: Put the log entry with both user and config values here
    return userVal ? userVal : defaultValue
  }
}

class UserOnlyResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal, Object defaultValue) {
    return userVal ? userVal : defaultValue
  }
}

class ConfigWinsResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal, Object defaultValue) {
// TODO: Put the log entry with both user and config values here
    return configVal
  }
}

class ConfigOnlyResolver implements Resolver {
  public Object resolve(Object userVal, Object configVal, Object defaultValue) {
    return configVal
  }
}

class ConfigMerge implements Resolver {
  public Object resolve(Object userVal, Object configVal, Object defaultValue) {

    if(userVal instanceof List &&  configVal instanceof List) {
      def out = []
      if(userVal != null) out += userVal
      if(configVal != null) out += configVal
      return out.unique()
    } else if(userVal instanceof Map &&  configVal instanceof Map) {
      def out = [:]
      if(userVal != null) out << userVal
      if(configVal != null) out << configVal
      return out
    } else if(userVal instanceof String &&  configVal instanceof String) {
      return userVal+"-"+configVal
    } else {
      throw new IllegalStateException("Type mismatch. UserVal Class = "+userVal.getClass().getName()+"; "+
                                      "configVal Class= "+configVal.getClass().getName())
    }
  }
}

enum SBR_Render {
  USER_WINS("user-wins", new UserWinsResolver()),
  CONFIG_WINS("config-wins", new ConfigWinsResolver()),
  USER_ONLY("user-only", new UserOnlyResolver()),
  CONFIG_ONLY("config-only", new ConfigOnlyResolver()),
  EXCEPTION_ON_MISMATCH("exception-on-mismatch", null), // TODO: Write a resolver
  MERGE("merge", new ConfigMerge()) // TODO: Write a resolver

  private String tagValue
  private Resolver resolver

  public SBR_Render(aTagValue, aResolver) {
    tagValue = aTagValue
    resolver = aResolver
  }

  public Object resolve(userVal, configVal, defaultValue) {
    if(resolver != null) return resolver.resolve(userVal, configVal, defaultValue)
    else throw new IllegalStateException("The resolver is not set for $tagValue")
  }

  static final SBR_Render getByTagValue(aTagValue) {

    Map<String, SBR_Render> tagVal2RenderMap =  SBR_Render.values()
                                                     .collect{aType -> [(aType.tagValue) : aType]}
                                                     .inject([:]){acc, item -> item.each{entry -> acc.put(entry.key, entry.value)}; return acc}

     SBR_Render theRender = tagVal2RenderMap[aTagValue]
     if(theRender == null) throw new IllegalArgumentException("[SBR_Render] Unknown tagValue: "+aTagValue)

     return theRender
  }

}

// Generalizes all constraints
interface SBR_Constraint {
  boolean compliant(val)
}

class SBR_Composite_Constraint implements SBR_Constraint {
  private List<SBR_Constraint> constraintList = new ArrayList<>();

  static final SBR_Constraint parseTag(tag, aWhitelistValidator) {
    SBR_Constraint cumulativeConstr = new SBR_Composite_Constraint();
    tag.collect{key, value ->
      switch(key) {
        case "sbr-enum": cumulativeConstr.constraintList.add(new SBR_Enum_Constraint(value)); break;
        case "sbr-from": cumulativeConstr.constraintList.add(new SBR_From_Constraint(value)); break;
        case "sbr-to": cumulativeConstr.constraintList.add(new SBR_To_Constraint(value)); break;
        case "sbr-whitelist": cumulativeConstr.constraintList.add(new SBR_Whitelist_Constraint(aWhitelistValidator, value)); break; // TODO real whitelist loaded needed here instead of an empty map
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
  private ArrayList<String> enumValue = new ArrayList<String>();

  public SBR_Enum_Constraint(inputEnum) {
    enumValue.addAll(inputEnum)
  }

  public boolean compliant(aVal) {
    def status = enumValue.find{val -> val == aVal}
    return status ? true: false
  }
}

class SBR_Whitelist_Constraint implements SBR_Constraint {
  private String elementPointer
  private def whitelistValidator

   public SBR_Whitelist_Constraint(aWhitelistValidator, anElementPointer) {
     elementPointer = anElementPointer
     whitelistValidator = aWhitelistValidator
  }

  public boolean compliant(val) {
    switch(elementPointer) {
      case "resources": return whitelistValidator.validateWhitelistResources(val); break;
      case "events": return whitelistValidator.validateWhitelistEvents(val); break;
      case "plugins": return whitelistValidator.validateWhitelistPlugins(val); break;
      case "actions": return whitelistValidator.validateWhitelistActions(val); break;
      default: throw new IllegalStateException("SBR_Whitelist_Constraint contains an unknown $elementPointer inside as follows: $val")
    }
  }
}

class SBR_To_Constraint implements SBR_Constraint {
  private int toValue

  public SBR_To_Constraint(int aToValue) {
    toValue = aToValue;
  }

  public boolean compliant(val) {
    try {
      if(val && val != '')  return Integer.parseInt(val.toString()) <= Integer.parseInt(toValue.toString());
      else return false
    } catch(e) {
      throw new IllegalArgumentException("Invalid Integer: " + val + " is of type: " + val?.class);
    }
  }
}

class SBR_From_Constraint implements SBR_Constraint {
  private int fromValue

  public SBR_From_Constraint(int aFromValue) {
    fromValue = aFromValue
  }

  public boolean compliant(val) {
    try {
      if(val && val != '')  return Integer.parseInt(val.toString()) >= Integer.parseInt(fromValue.toString());
      else return false
    } catch(e) {
      throw new IllegalArgumentException("Invalid Integer: " + val + " is of type: " + val?.class);
    }
  }
}

// Encapsulates formulas and default values
interface SBR_Value {
  Object renderValue(config, context, asterisks)
}

class SBR_Example_Value implements SBR_Value {
  private def value;

  public SBR_Example_Value(aValue) {
    value = aValue;
  }

  public renderValue(config, context, asterisks) {
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

  public def renderValue(aConfig, aContext, aAsteriskList) {
    def sharedData = new Binding()
    def shell = new GroovyShell(sharedData)

    sharedData.setProperty('config', aConfig)
    sharedData.setProperty('context', aContext)
    aAsteriskList.eachWithIndex{item, idx -> sharedData.setProperty("asterisk$idx", item)}

    def result

    if(formula instanceof String) {
      result = formula.startsWith("_") ? formula.replace("_", "") : shell.evaluate('"'+formula+'"') // TODO Investigate what to do with an exception here
    } else if(formula instanceof Map) {
      result = formula.inject([:]){acc, item -> acc.put(item.key, shell.evaluate('"'+item.value+'"')); return acc}
    } else if(formula instanceof List) {
      result = formula.collect{item -> shell.evaluate('"'+item+'"')}
    } else {
      throw new IllegalStateException("The formula is of unknown type "+formula.getClass().getName())
    }

    return result;
  }


  public String toString() {
    return "formula: $formula" ;
  }
}

interface SBR_Template {
  Map<String, SBR_Rule> getPath2RuleMap()
}

class SBR_PreRule {
   SBR_Type_Descriptor type
   SBR_Render render
   SBR_Constraint constraint

   public SBR_PreRule(SBR_Type_Descriptor aType,
                   SBR_Render aRender,
                   SBR_Constraint aConstraint) {
     type = aType
     render = aRender
     constraint = aConstraint
   }

}

class SBR_Rule extends SBR_PreRule {
   SBR_Value value
   boolean isMandatory
   SBR_Example_Value defaultValue
   List<String> asteriskValues = []

   public SBR_Rule(SBR_Type_Descriptor aType,
                   SBR_Render aRender,
                   SBR_Constraint aConstraint,
                   SBR_Value aValue,
                   boolean aIsMandatory,
                   SBR_Example_Value aDefaultValue) {
      super(aType, aRender, aConstraint)
      isMandatory = aIsMandatory
      value = aValue
      defaultValue = aDefaultValue
   }

   public Object applyRule(userValue, path, config, context) {

     def valueRendered = (value != null) ? value.renderValue(config, context, asteriskValues) : userValue;
     def defValue = (defaultValue != null) ? defaultValue.renderValue(config, context, asteriskValues) : ""
     def theValue = render.resolve(userValue, valueRendered, defValue)


     type.validate(theValue); // This will raise the exception if type is wrong but we shave to suppliment it with path so TODO is to catch the exceotion then add the path and the re-throw it

     if(constraint != null && !constraint.compliant(theValue)) {
       throw new IllegalStateException("Your application definition - serverless.yml contains value `${theValue}` for `${path}` that violates one of our rules. Please refer to documentation for valid values for `${path}`.")
     }
     return theValue
   }

   public String toString() {
     return "SBR_Rule {type: $type, render: $render, value: $value, isMandatory: $isMandatory}\n";
   }
}

class SBR_NonPrimaryRule extends SBR_PreRule {
  def template

  public SBR_NonPrimaryRule(SBR_Type_Descriptor aType,
                            SBR_Render aRender,
                            SBR_Constraint aConstraint,
                            aTemplate) {
      super(aType, aRender, aConstraint)
      template = aTemplate
  }

  public Map<String, SBR_Rule> getLinearRuleMap() {
    return convertRuleForestIntoLinearMap(template)
  }

  public String toString() {
    String templateClass = template.getClass().getName()
    return "SBR_NonPrimaryRule {type: $type, render: $render, templateClass: $templateClass}\n"
  }
}

// Those below are stray functions now TODO: May need to move them into a separate class to encapsulate
boolean isLeaf(Object aTag) {
  return aTag instanceof Map && aTag.get("sbr-type") != null
}

def extractLeaf(Map<String, Object> aTag) {
  SBR_Type_Descriptor type = SBR_Type_Descriptor.parseTag(aTag);
  SBR_Render render = SBR_Render.getByTagValue(aTag["sbr-render"]);
  SBR_Constraint constraint = null;
  def constraintTag = aTag["sbr-constraint"]
  if(constraintTag != null) {
    constraint = SBR_Composite_Constraint.parseTag(constraintTag, whitelistValidator)
  }

  SBR_Value value = null;
  SBR_Example_Value defaultValue
  def valueTag = aTag["sbr-value"]
  if(valueTag != null) {
    if(valueTag["sbr-formula"] != null) value = SBR_Formula_Value.parseTag(valueTag) // Only Formula tag is implemented for now this if shall go away eventully
    if(valueTag["sbr-example"] != null) defaultValue = new SBR_Example_Value(valueTag["sbr-example"])
  }

  boolean primary = (aTag["sbr-primary"] != null && !aTag["sbr-primary"]) ? false : true

  boolean isMandatory = (aTag["sbr-mandatory"] == true) ? true : false

  SBR_PreRule retVal = primary ? new SBR_Rule(type, render, constraint, value, isMandatory, defaultValue) : new SBR_NonPrimaryRule(type, render, constraint, aTag["sbr-template"])

  return retVal;

}

def collector(ruleTree, currentPath) {
  if(isLeaf(ruleTree)) return [(new String(currentPath)) : extractLeaf(ruleTree)]

  if(ruleTree instanceof Map) return ruleTree.collect{key, val -> collector(val, currentPath+"/"+key)}
  else {return ruleTree.collect{val -> collector(val, currentPath)}}
}

/* Convering a map of maps of maps into a united map of 'path to rule' relations like
["/service/name": SBR_Rule {type: SBR_Type_Descriptor{type:AWS_ARTIFACT_NAME; underlyingTypeList=[]}, render: CONFIG_ONLY, isPrimary: true, value: formula: ${configLoader.INSTANCE_PREFIX}-${config.service}},
 "/service/awsKmsKeyArn": SBR_Rule {type: SBR_Type_Descriptor{type:ARN_KMS; underlyingTypeList=[]}, render: USER_ONLY, isPrimary: true, value: null},
 "/frameworkVersion": SBR_Rule {type: SBR_Type_Descriptor{type:STR; underlyingTypeList=[]}, render: USER_ONLY, isPrimary: true, value: null},
          ................
]
*/
Map<String, SBR_Rule> convertRuleForestIntoLinearMap(/* Map<String, Object> */  ruleForest) {
 // Loading and parsing all the rules to be presented in easily discoverable and executable form as map like [path:rule] i.e. [/service/name:SBR_Rule@127eae33, /service/awsKmsKeyArn:SBR_Rule@7e71274c, /frameworkVersion:SBR_Rule@5413e09 ...

    Map<String, SBR_Rule> path2RuleMap =  collector(ruleForest, "") // collector is the function that will return the map of enclosed map due to it rucursive nature
                                                                     .flatten() // so flatten is needed to convert this tree like structure into the map like [[/service/name:SBR_Rule@127eae33], [/service/awsKmsKeyArn:SBR_Rule@7e71274c], ...]
                                                                     .inject([:]){acc, item -> item.each{entry -> acc.put(entry.key, entry.value)};  return acc} // Now the reduce step is needed to convert all the sub-maplets into one big convenient map

  return path2RuleMap
}

def extractRefs(Map<String, SBR_Rule> aPath2RuleMap, Map<String, SBR_Rule> nonPrimaryRules) {
  def ret = aPath2RuleMap.inject([:]){acc, item -> def npr = resolveReferencedRule(item.value, nonPrimaryRules); if(npr != null) acc.put(item.key, item.value); return acc}
  return ret
}


def extractNonPrimary(Map<String, SBR_Rule> aPath2RuleMap) {
  def ret = aPath2RuleMap.inject([:]){acc, item -> if(item.value instanceof SBR_NonPrimaryRule ) acc.put(item.key, item.value); return acc}
  return ret
}

Map<String, SBR_Rule> explodeNonPrimaryRule(aRule, String prefix) {
  return convertRuleForestIntoLinearMap(aRule.template).inject([:]){acc, item -> acc.put(prefix+"/"+"*"+item.key, item.value); return acc}
}

SBR_NonPrimaryRule resolveReferencedRule(SBR_PreRule aReferrerRule, Map<String, SBR_NonPrimaryRule> nonPrimaryRulesMap) {
  SBR_Type_Descriptor type = aReferrerRule.type;
  if(type.isMap()) {
    String correspondingTagType = type.underlyingTypeList[1].tagValue
    return nonPrimaryRulesMap["/"+correspondingTagType]
  } else if(type.isList()) {
    String correspondingTagType = type.underlyingTypeList[0].tagValue
    return nonPrimaryRulesMap["/"+correspondingTagType]
  } else {
    return null
  }
}

// Rules that do not have its own value but instead in its type (that can be a MAP or LIST) it contains the reference to non-primary rule
Map<String, SBR_Rule> resolveReferences(aReferenceRules, nonPrimaryRules) {
  def theRules = aReferenceRules.inject([:]){acc, item -> acc.put(item.key, resolveReferencedRule(item.value, nonPrimaryRules)); return acc}
                                .inject([:]){acc, item -> def expl = explodeNonPrimaryRule(item.value, item.key); expl.each{entry -> acc.put(entry.key, entry.value)}; return acc}

  return theRules
}


/* Resolves all the type based references that ties together an SBR_Rule that is called 'Referrer' and non-primary rule that we call 'Resolved'.
   The resolved set is added to the original input map while the Referrers and non-primary elements are deleted from the input */
Map<String, SBR_Rule> rulePostProcessor(Map<String, SBR_PreRule> aPath2RuleMap) {
  Map<String, SBR_NonPrimaryRule> path2NonPrimaryRuleMap = extractNonPrimary(aPath2RuleMap) // Finding all non-primary rules
  Map<String, SBR_Rule> path2ReferrerRuleMap = extractRefs(aPath2RuleMap, path2NonPrimaryRuleMap) // Finding all Referrers that address the associated non-primary rule
  Map<String, SBR_Rule> path2ResolvedRuleMap = resolveReferences(path2ReferrerRuleMap, path2NonPrimaryRuleMap) //Replacing all the referrer parts with the content from non

  // Repeating the excersise here as I know that the  path2ResolvedRuleMap itself will still contain the rules to be resolver over again. Ideally it should have been done in the loop that continues the process until no resolutions has occured
  Map<String, SBR_Rule> path2ReferrerRuleMapFinal = extractRefs(path2ResolvedRuleMap, path2NonPrimaryRuleMap)
  Map<String, SBR_Rule> path2ResolvedRuleMapFinal = resolveReferences(path2ReferrerRuleMapFinal, path2NonPrimaryRuleMap)

  if(path2ResolvedRuleMap != null) path2ResolvedRuleMapFinal << path2ResolvedRuleMap // Concat two resulting maps

  Map<String, SBR_PreRule> path2RuleMap2Ret = subtract(aPath2RuleMap,
                                                       path2NonPrimaryRuleMap,
                                                       path2ReferrerRuleMap,
                                                       path2ReferrerRuleMapFinal) // aPath2RuleMap - path2NonPrimaryRuleMap - path2ReferrerRuleMap - path2ReferrerRuleMapFinal

  if(path2ResolvedRuleMapFinal != null) path2RuleMap2Ret << path2ResolvedRuleMapFinal // Adding all resolved maps to the original input

  return path2RuleMap2Ret
}

def subtract(target, arg1, arg2, arg3) {
  return target.inject([:]){acc, item -> if(arg1[item.key] == null && arg2[item.key] == null && arg3[item.key] == null) acc.put(item.key, item.value); return acc}
}

/* Merges two maps nicely. In case of conflict the second (later) argument overwrites the first (early) one  */
def Map merge(Map[] sources) {
    if (sources.length == 0) return [:]
    if (sources.length == 1) return sources[0]

    sources.inject([:]) { result, source ->
      source.each { k, v ->
          result[k] = (result[k] instanceof Map && v instanceof Map ) ?  merge(result[k], v) : v
      }
      return result
    }
}


/* Converting Array to List that is a much nicer to work with */
def toList(value) {
    [value].flatten().findAll { it != null }
}

/* Creates a new map and adds it to the envelopeMap as the new entry under the given key */
def enclose(Map envelopeMap, String key) {
  if(key.isEmpty()) return envelopeMap
  def Map enclosedContent = [:]
  envelopeMap[key] = enclosedContent
  return enclosedContent
}

/* Returns a new yml treelet with a single path which the rule result is placed under (at) */
def retrofitMandatoryFields(String              aPath,
                            SBR_Rule            rule,
                                                config,
                            Map<String, String> context,
                            Transformer transformer) {

  Map<String, Object> ymlTree = [:]
  String[] segmentedPath = aPath.split("/")

  List<String> pathAsList = toList(segmentedPath)
// The Jenkins groovy does not support removeLast so I had to substitute it with two following lines
  String lastName = pathAsList[pathAsList.size()-1]
  pathAsList.removeAt(pathAsList.size()-1)
  def lastHandler =  pathAsList.inject(ymlTree){acc, item -> enclose(acc, item)}

  def userDefaultValue = ""
  if(rule.type.isMap()) userDefaultValue = [:]
  if(rule.type.isList()) userDefaultValue = []
  def origRule = transformer.ruleMatcher(aPath)
  if (origRule) {
    rule.asteriskValues = origRule.asteriskValues
  }
  lastHandler[lastName] = rule.applyRule(userDefaultValue, aPath, config, context)

  return ymlTree
}

def makeList(list) {
    List created = new ArrayList()
    list.each { line ->
        created.add(line)
    }
    return created
}

def getLeafPath (String templatedPath, Map<String, List> path2OrigRuleMap) {
  def pathKeyArr = makeList(templatedPath.split('/'))
  def maxList = path2OrigRuleMap.findAll { entry -> entry.key.split('/').size() == pathKeyArr.size() }
  def maxSize = maxList.max { it -> it.value.size() }
  def pathTempKeyList = path2OrigRuleMap.find {it -> it.value.size() == maxSize}                                       

  return pathTempKeyList ? pathTempKeyList.value: []
}


def findTargetPath (String templatedPath, Map<String, List> path2OrigRuleMap) {
  def pathKey = path2OrigRuleMap.keySet().find { templatedPath.contains(it)  }
  def targetedPaths = pathKey ? path2OrigRuleMap.get(pathKey) : getLeafPath(templatedPath, path2OrigRuleMap)

  def pathKeyArr = makeList(templatedPath.split('/'))
  def asteriskIdx = pathKeyArr.findIndexOf{it =="*"}

  List path2OrigKey = new ArrayList()
  for (path in targetedPaths) {
    def pathArr = makeList(path.split('/'))
    def pathValue = pathArr[asteriskIdx]
    pathKeyArr[asteriskIdx] = pathValue
    def reqPath = pathKeyArr.join("/")
    if(reqPath.contains("*")) {
      def commons = pathKeyArr.intersect(pathArr)
      reqPath = commons.join("/")
      def difference = pathKeyArr.plus(pathArr)
      difference.removeAll(commons)
      difference.removeAll("*")
      def diff = difference.join("/")
      reqPath = "${reqPath}/${diff}"
    }
    path2OrigKey.add(reqPath)
  }

  return path2OrigKey
}


/* Returning a new yml tree with paths enlisted inside the map and with associated rule result placed under */
def retrofitMandatoryFields(Map<String, SBR_Rule> aPath2RuleMap,
                                                  config,
                            Map<String, String>   context,
                            Transformer transformer) {

  Map<String, List> path2OrigRuleMap = transformer.path2OrigRuleMap
  def accumulator = aPath2RuleMap.inject([:]){acc, item ->
  def targetedPaths = new ArrayList()
  if((item.key).toString().contains("*")) targetedPaths = findTargetPath (item.key, path2OrigRuleMap)
  else targetedPaths.add(item.key)

  targetedPaths.each { entry ->
    def ymlTreelet = retrofitMandatoryFields(entry, item.value, config, context, transformer)
    def accCopy = [:]; if(acc != null) accCopy << acc;
    acc  = merge(accCopy, ymlTreelet);
  }
  return acc;}
  return accumulator
}

/**
* Prepare serverless.yml from
* config
**/
def prepareServerlessYml(aConfig, env, configLoader, envDeploymenDescriptor, accountDetails) {
	def deploymentDescriptor = null
  def isPrimaryAccount = configLoader.AWS.ACCOUNTS.find{ it.ACCOUNTID == aConfig.accountId}.PRIMARY ? true : false
  if( envDeploymenDescriptor != null){
    deploymentDescriptor = envDeploymenDescriptor
  } else {
    deploymentDescriptor = aConfig['deployment_descriptor']
  }

  try {
    def appContent = readFile('application.yml').trim() // copy of the user serverless.yml
    if(!appContent.isEmpty()) {
      echo "User supplied serverless.yml is being used."
      deploymentDescriptor = appContent
    }
  } catch(e) { // TODO to catch the type error
      echo "The user supplied serverless.yml does not exist in the code. So the default value from config will be used: ${e}"
  }

    def doc = deploymentDescriptor  ? readYaml(text: deploymentDescriptor ) : [:] // If no descriptor present then simply making an empty one. The readYaml default behavior is to return empty string back that is harful as Map not String is expected below
    def logStreamer = configLoader.JAZZ.PLATFORM.AWS.KINESIS_LOGS_STREAM.PROD

    def destLogStreamArn = configLoader.AWS.ACCOUNTS.find{ it.ACCOUNTID == aConfig.accountId}.PRIMARY ? logStreamer : 
                            accountDetails.REGIONS.find{it.REGION == aConfig.region}.LOGS.PROD
 

    context =["environment_logical_id": env,
            "INSTANCE_PREFIX": configLoader.INSTANCE_PREFIX,
            "REGION": aConfig.region,
            "cloudProvider": "aws",
            "kinesisStreamArn": destLogStreamArn,
            "platformRoleArn": configLoader.AWS.ACCOUNTS.find{ it.ACCOUNTID == aConfig.accountId}.IAM.PLATFORMSERVICES_ROLEID, // pick the role for selected account
            "serverlessFrameworkVersion": ">=1.0.0 <2.0.0"]  

    if (doc && doc instanceof Map && doc['service']) doc.remove('service')
    if (doc && doc instanceof Map && doc['frameworkVersion']) doc.remove('frameworkVersion')

    def rules = readYaml(text: sbrContent)
    def resultingDoc = processServerless(doc,
                                          rules,
                                          aConfig,
                                          context)

// Supplying the Outputs element to render all arns for all 'resources/Resources that got listed'
    def smallResourcesElem = resultingDoc['resources']
    if(smallResourcesElem) {
      def bigResourcesElem = smallResourcesElem['Resources']
      if(bigResourcesElem) {
        def bigOutputsElem = smallResourcesElem['Outputs']
        if(!bigOutputsElem) {
          bigOutputsElem = [:]
          smallResourcesElem['Outputs'] = bigOutputsElem
        }
        def resourceKeys = bigResourcesElem.collect{key, val -> key}
        /* Forming a record that extracts the arn from resulting item for each of resource key extracted from resources:
        UsersTableArn:\n
        Value:\n
        \"Fn::GetAtt\": [ usersTable, Arn ]\n
        */
        resourceKeys.collect{name ->
        bigOutputsElem[name+'Arn']=["Value":["Fn::GetAtt":[name, "Arn"]]]
      }
    }
  }

  // inject log subscription ALWAYS - TODO implement in SBR
  def logSubscriptionMap = [logSubscription:[enabled:true, destinationArn:context.kinesisStreamArn]]
  if(isPrimaryAccount) logSubscriptionMap.logSubscription['roleArn'] = context.platformRoleArn
    
  echo "logSubscriptionMap: $logSubscriptionMap"

  // overwriting if exists
  if (resultingDoc?.custom) resultingDoc.custom.logSubscription = logSubscriptionMap.logSubscription
  else resultingDoc.custom = logSubscriptionMap // setting it
    

    // check provider IAM Role Statements for Resource = "*"  - TODO implement in SBR
    if (resultingDoc.provider?.iamRoleStatements)
    {
        // iterate through
        resultingDoc.provider.iamRoleStatements.each { roleStatement ->
            if (roleStatement.Resource?.trim()?.equals("*"))
            {
                throw new IllegalStateException("Your application definition - serverless.yml contains a wild-card Resource ${roleStatement} that is not supported. Please refer to documentation for supported Resource values.");
            }
        }
    }
    // check resources Policies for AWS::IAM::Role - TODO implement in SBR
    if (resultingDoc.resources?.Resources)
    {
        resultingDoc.resources?.Resources.each { name, resource ->
            if (resource.Type?.equals("AWS::IAM::Role"))
            {
                if (resource.Properties?.Policies)
                {
                    resource.Properties?.Policies.each { policy ->
                        if (policy.PolicyDocument?.Statement)
                        {
                            policy.PolicyDocument.Statement.each { statement ->
                                if (statement.Resource?.trim()?.equals("*"))
                                {
                                    throw new IllegalStateException("Your application definition - serverless.yml contains a wild-card Resource ${resource} that is not supported. Please refer to documentation for supported Resource values.");
                                }
                            }
                        }
                    }
                }
            }
        }
    }

  return resultingDoc
}


return this
