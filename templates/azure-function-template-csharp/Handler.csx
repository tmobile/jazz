#r "Newtonsoft.Json"
#load "./components/Logger.csx"
#load "./components/ConfigHandler.csx"
#load "./components/model/Response.csx"
using Newtonsoft.Json;

public class Handler<T> {


    public string execute(T myEvent, ILogger log, ExecutionContext context)
    {
        Logger.init(log, context);
        Logger.debug($"C# trigger function executed : {context.FunctionName}");
        Logger.debug($"my event: {myEvent}");


      //Following code snippet describes how to log messages within your code:
      /*
        Logger.trace("Finer-grained informational events than the DEBUG ");
        Logger.info("Interesting runtime events (Eg. connection established, data fetched etc.)");
        Logger.warn("Runtime situations that are undesirable or unexpected, but not necessarily \"wrong\".");
        Logger.error("Runtime errors or unexpected conditions.");
        Logger.debug("Detailed information on the flow through the system.');
      */

        ConfigHandler configHandler = new ConfigHandler(context);
        string configValue = configHandler.getConfig();

        Response res = new Response{ Data = configValue, Input = myEvent.ToString()};
        var jsonResponse = JsonConvert.SerializeObject(res, Formatting.Indented);
        return jsonResponse;
    }
}
