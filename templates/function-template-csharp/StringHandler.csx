#load "IHandler.csx"
using System;

public class StringHandler : IHandler<String>
{

    public bool handle(String myEvent, ILogger log)
    {
        log.LogInformation($"C# eventhub trigger function executed at: {DateTime.Now}");
        log.LogInformation($"my event: {myEvent}");
        return true;
    }
}