#load "..\StringHandler.csx"
using System;

public static void Run(string myEvent, ILogger log)
{
    log.LogInformation(myEvent);
    StringHandler handler = new StringHandler();
    handler.handle(myEvent, log);
}
