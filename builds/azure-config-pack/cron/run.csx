#load "..\TimerHandler.csx"
using System;

public static void Run(TimerInfo myEvent, ILogger log)
{

    log.LogInformation(myEvent.ToString());
    TimerHandler handler = new TimerHandler();
    handler.handle(log, myEvent);
}
