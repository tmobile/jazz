#r "Microsoft.Azure.DocumentDB.Core"
#load "..\DocumentListHandler.csx"
using System;
using System.Collections.Generic;
using Microsoft.Azure.Documents;

public static void Run(IReadOnlyList<Document> myEvent, ILogger log)
{
    log.LogInformation($"my event: {myEvent.Count}");
    DocumentListHandler handler = new DocumentListHandler();
    handler.handle(myEvent, log);
}
