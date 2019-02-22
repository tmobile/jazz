#load "IHandler.csx"
using System;

public class StreamHandler : IHandler<Stream>
{

    public bool handle(Stream myEvent, ILogger log)
    {
        log.LogInformation($"C# stream trigger function executed at: {DateTime.Now}");
        log.LogInformation($"my event: {myEvent}");
        return true;
    }
}