#r "Newtonsoft.Json"
#load "./components/Logger.csx"
#load "./components/ConfigHandler.csx"
#load "./components/model/Response.csx"
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using Newtonsoft.Json;





    public static String Run(HttpRequest req, ILogger log, ExecutionContext context)
    {
        Logger.init(log, context);
        Logger.debug($"C# trigger function executed : {context.FunctionName}");
        Logger.debug($"my event: {req}");


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

        Response res = new Response{ Data = configValue, Input = req.ToString()};
        var jsonResponse = JsonConvert.SerializeObject(res, Formatting.Indented);
        return jsonResponse;
    }
