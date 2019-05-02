import groovy.transform.Field

echo "sbr.groovy is being loaded"

@Field def sbrContent

def initialize() {
  sbrContent = readFile("./sls-app/serverless-build-rules.yml")
}

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
def Map<String, Object> processServerless(Map<String, Object> origAppYmlFile,
                                          Map<String, Object> rulesYmlFile,
                                                              config,
                                          Map<String, String> context) {

 // Loading and parsing all the rules to be presented in easily discoverable and executable form as map like [path:rule] i.e. [/service/name:SBR_Rule@127eae33, /service/awsKmsKeyArn:SBR_Rule@7e71274c, /frameworkVersion:SBR_Rule@5413e09 ...
    Map<String, SBR_Rule> rules =  convertRuleForestIntoLinearMap(rulesYmlFile)
    Map<String, SBR_Rule> resolvedRules = rulePostProcessor(rules)

    Transformer transformer = new Transformer(config, context, resolvedRules) // Encapsulating the config, context and rules into the class so that they do not have to be passed as an arguments with every call of recursive function

    return transformer.transform(origAppYmlFile);
}

/* This class encapsulates config, context and rules so that they don't have to be carried over with every call of recursive function */
class Transformer {
  private def config;
  private Map<String, String> context;
  private Map<String, SBR_Rule> path2RulesMap;
  private Map<String, SBR_Rule> templatedPath2RulesMap;

  public Transformer(aConfig, aContext, aPath2RulesMap) {
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
    targetPathSegments.eachWithIndex{seg, idx -> acc &= (seg == templatedPathSegments[idx] ||  templatedPathSegments[idx] == "*")}
    return acc
  }

  List<String> resolveAsterisks(String templatedPath, String targetPath) {
    List<String> val2Ret = []
    if(!templatedPath.contains("*")) return val2Ret

    String[] templatedPathSegments = templatedPath.split("/")
    String[] targetPathSegments = targetPath.split("/")

    targetPathSegments.eachWithIndex{seg, idx -> if(templatedPathSegments[idx] == "*") val2Ret.add(targetPathSegments[idx])}

    return val2Ret

  }


  private SBR_Rule ruleMatcher(aPath) {
    SBR_Rule simpleMatch = path2RulesMap[aPath]
    if(simpleMatch != null) {
      return simpleMatch;
    } else {
      def path2rule = templatedPath2RulesMap.find{path2Rule -> pathMatcher(path2Rule.key, aPath)}
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
   JSON("json", null), // TODO Must provide a validator

   ARN("arn", null), // Generic ARN TODO Must provide a validator
   ARN_KMS("arn-kms", null),  // TODO Must provide a validator
   ARN_IAM("arn-iam", null),  // TODO Must provide a validator
   ARN_SNS("arn-sns", null), // TODO Must provide a validator
   ARN_LAYER("arn-layer", null), // TODO Must provide a validator
   ARN_SQS("arn-sqs", null), // TODO Must provide a validator
   ARN_IAM_POLICY("arn-iam-policy", null), // TODO Must provide a validator
   ARN_KINESIS("arn-kinesis", null), // TODO Must provide a validator
   AWS_ID("aws-id", null),  // TODO Must provide a validator
   AWS_ARTIFACT_NAME("aws-artifact-name", null),  // TODO Must provide a validator
   AWS_VAR_NAME("aws-var-name", null),  // TODO Must provide a validator
   AWS_BUCKET_NAME("aws-bucket-name", null),  // TODO Must provide a validator
   AWS_TAG_VAL("aws-tag-value", null),  // TODO Must provide a validator
   AWS_SCHEDULE_RATE("aws-schedule-rate", null), // TODO Must provide a validator
   PATH("path", null),  // TODO Must provide a validator
   AWS_VAR_VALUE("aws-var-value", null), // TODO Must provide a validator
   AWS_PRINCIPAL("aws-principal", null),  // TODO Must provide a validator
   AWS_DESCRIPTION("aws-description", null), // TODO Must provide a validator
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

   public void validate(aValue) { // TODO: This method needs to be implemented
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

class ConfigMerge implements Resolver {
  public Object resolve(Object userVal, Object configVal) {
    println "ConfigMerge called: $userVal, $configVal"
    if(userVal instanceof List &&  configVal instanceof List) {
      def out = []
      out << userVal
      out << configVal
      return out
    } else if(userVal instanceof Map &&  configVal instanceof Map) {
      def out = [:]
      out << userVal
      out << configVal
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
        case "sbr-whitelist": cumulativeConstr.constraintList.add(new SBR_Whitelist_Constraint([:], value)); break; // TODO real whitelist loaded needed here instead of an empty map
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
      result = shell.evaluate('"'+formula+'"') // TODO Investigate what to do with an exception here
    } else if(formula instanceof Map) {
      result = formula.inject([:]){acc, item -> acc.put(item.key, shell.evaluate('"'+item.value+'"')); return acc}
    } else if(formula instanceof List) {
      resule = formula.collect{item -> shell.evaluate('"'+item.value+'"')}
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
   List<String> asteriskValues = []

   public SBR_Rule(SBR_Type_Descriptor aType,
                   SBR_Render aRender,
                   SBR_Constraint aConstraint,
                   SBR_Value aValue) {
      super(aType, aRender, aConstraint)
      value = aValue
   }

   public Object applyRule(userValue, path, config, context) {
     def valueRendered = (value != null) ? value.renderValue(config, context, asteriskValues) : userValue;
     def theValue = render.resolve(userValue, valueRendered)
     type.validate(theValue); // This will raise the exception if type is wrong but we shave to suppliment it with path so TODO is to catch the exceotion then add the path and the re-throw it
     if(constraint != null && !constraint.compliant(theValue)) {
       throw new IllegalStateException("Constraint violated at the path $path with the value: $theValue")
     }
     return theValue
   }

   public String toString() {
     return "SBR_Rule {type: $type, render: $render, value: $value}\n";
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
    constraint = SBR_Composite_Constraint.parseTag(constraintTag)
  }
  SBR_Value value = null;
  def valueTag = aTag["sbr-value"]
  if(valueTag != null) {
    if(valueTag["sbr-formula"] != null) value = SBR_Formula_Value.parseTag(valueTag) // Only Formula tag is implemented for now this if shall go away eventully
  }

  boolean primary = (aTag["sbr-primary"] != null && !aTag["sbr-primary"]) ? false : true

  SBR_PreRule retVal = primary ? new SBR_Rule(type, render, constraint, value) : new SBR_NonPrimaryRule(type, render, constraint, aTag["sbr-template"])

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
Map<String, SBR_Rule> convertRuleForestIntoLinearMap(/* Map<String, Object> */ruleForest) {
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
  def ret = aPath2RuleMap.inject([:]){acc, item -> if(item.value instanceof SBR_NonPrimaryRule) acc.put(item.key, item.value); return acc}
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

  path2ResolvedRuleMapFinal << path2ResolvedRuleMap // Concat two resulting maps

  Map<String, SBR_PreRule> path2RuleMap2Ret = [:] << aPath2RuleMap // Copying the original map in order to avoid any possible side-effect on to the input data
  path2RuleMap2Ret.keySet().removeAll(path2NonPrimaryRuleMap.keySet()) // Removing all non-primary rules that are irrelevant now
  path2RuleMap2Ret.keySet().removeAll(path2ReferrerRuleMap.keySet()) // Removing referrer rules
  path2RuleMap2Ret.keySet().removeAll(path2ReferrerRuleMapFinal.keySet()) // Removing all the double-reference referrers now because they are irrelevant either

  path2RuleMap2Ret << path2ResolvedRuleMapFinal // Adding all resolved maps to the original input

  return path2RuleMap2Ret
}

return this


//SBR_Type_Descriptor d = SBR_Type_Descriptor.parseTag(["sbr-type": "[int]"])
//println d.isList()


//println SBR_Type.getByTagValue("none")
println ">>>>>>>>>>>>>>>>>>>>>>>>>"

/*  boolean pathMatcher(String templatedPath, String targetPath) {
    String[] templatedPathSegments = templatedPath.split("/")
    String[] targetPathSegments = targetPath.split("/")
    if(templatedPathSegments.length != targetPathSegments.length) return false
    println targetPathSegments
    boolean acc = true
    targetPathSegments.eachWithIndex{seg, idx -> acc &= (seg == templatedPathSegments[idx] ||  templatedPathSegments[idx] == "*")}
    return acc
  }


lll = pathMatcher("/f/", "/f/")
println "lll="+lll */

// (seg.isEmpty() && templatedPath[idx].isEmpty()) || (seg.equals(templatedPath[idx]) || templatedPath[idx].equals("*"))
// /* && templatedPath[idx].isEmpty()*/) || (segment == templatedPath[idx] || templatedPath[idx] == "*")
/*
@Grab('org.yaml:snakeyaml:1.17')
import org.yaml.snakeyaml.Yaml
parser = new Yaml()

config = ["service_id": "4a053679-cdd4-482a-a34b-1b83662f1e81",
          "service": "olegservice28",
          "domain": "olegdomain28",
          "created_by": "admin",
          "type":"sls-app",
          "runtime":"nodejs8.10",
          "region":"us-west-2b",
          "cloud_provider": "aws"]

context =  ["INSTANCE_PREFIX": "slsapp19",
            "asterisk": "yyy",
            "environment_logical_id": "dev"]

Map<String, Object> initialSmallServerless = parser.load(new File("/Users/olegfomin/verysmallserverless.yml").text) // Here provide a path to overly simplistic serverless.yml like
//service:
//  name: myService
//  awsKmsKeyArn: arn:aws:kms:us-east-1:XXXXXX:key/some-hash
Map<String, Object> sbrContent = parser.load(new File("/Users/olegfomin/rajeev/jenkins-build-sls-app/serverless-build-rules.yml").text) // Here provide a path to your serverless-build-rules.yml

Map<String, SBR_Rule> rules = convertRuleForestIntoLinearMap(sbrContent)

Map<String, SBR_Rule> after = rulePostProcessor(rules)

// println after


// println explodeNonPrimaryRule(rules["/function"], "/functions")

Map<String, Object> resultingServerless = processServerless(initialSmallServerless, sbrContent, config, context)
println resultingServerless */
