#load "..\Handler.csx"
using System;

public static void Run(Stream myEvent, ILogger log, ExecutionContext context)
{

    Handler<Stream> handler = new Handler<Stream>();
    string result = handler.execute(myEvent, log, context);
    log.LogInformation($"response: {result}");
}
