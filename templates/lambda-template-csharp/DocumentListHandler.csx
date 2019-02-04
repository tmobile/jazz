#load "IHandler.csx"
using System;



using System.Collections.Generic;
using Microsoft.Azure.Documents;


public class DocumentListHandler : IHandler<IReadOnlyList<Document>>
{

    public bool handle(IReadOnlyList<Document> myEvent, ILogger log)
    {
        log.LogInformation($"C# stream trigger function executed at: {DateTime.Now}");

        log.LogInformation("Documents size " + myEvent.Count);
        log.LogInformation("First document Id: " + myEvent[0].Id);
        log.LogInformation("First document: " + myEvent[0]);
        return true;
    }
}
