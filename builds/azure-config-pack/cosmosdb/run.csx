#r "Microsoft.Azure.DocumentDB.Core"
#load "..\Handler.csx"
using System;
using System.Collections.Generic;
using Microsoft.Azure.Documents;

public static void Run(IReadOnlyList<Document> myEvent, ILogger log, ExecutionContext context)
{

    Handler<IReadOnlyList<Document>> handler = new Handler<IReadOnlyList<Document>>();
    string result = handler.execute(myEvent, log, context);
    log.LogInformation($"response: {result}");
}
