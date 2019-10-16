#load "..\Handler.csx"
using System;

public static void Run(TimerInfo myEvent, ILogger log, ExecutionContext context)
{

    Handler<TimerInfo> handler = new Handler<TimerInfo>();
    string result = handler.execute(myEvent, log, context);
    log.LogInformation($"response: {result}");
}
