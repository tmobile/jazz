#load "IHandler.csx"
using System;

public class TimerHandler : IHandler<TimerInfo>
{

    public bool handle(TimerInfo myEvent, ILogger log)
    {
        log.LogInformation($"C# eventhub trigger function executed at: {DateTime.Now}");
        log.LogInformation($"my event: {myEvent}");
        return true;
    }
}