#load "..\StreamHandler.csx"
using System;

public static void Run(Stream myEvent, ILogger log)
{
    log.LogInformation(myEvent.ToString());
    StreamHandler handler = new StreamHandler();
    handler.handle(myEvent, log);
}
