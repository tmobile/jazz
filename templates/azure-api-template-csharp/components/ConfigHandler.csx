public class ConfigHandler {

  private ExecutionContext context;
  private string configValue;
  private string functionName;

  public ConfigHandler(ExecutionContext executionContext) {

    context = executionContext;

    functionName = context.FunctionName;

    if(null != functionName) {
      int lastIndx = functionName.LastIndexOf("-");
      string stage = functionName.Substring(lastIndx+1);

      var path = System.IO.Path.Combine(context.FunctionAppDirectory, $"{functionName}\\config\\{stage}.properties");
      string[] text = System.IO.File.ReadAllLines(path);
      configValue = text[0];
    }
  }


  public string getConfig() {
    return configValue;

  }

  public string getFunctionName() {
    return functionName;
  }
}
