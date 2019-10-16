public class Logger {

    private static ILogger logger;
    private static ExecutionContext context;

    public static void init(ILogger azureLogger, ExecutionContext executionContext) {

        logger = azureLogger;
        context = executionContext;
    }

    public static void info(string message) {

        logger.LogInformation($" INFO {context.InvocationId} {message}");

    }

    public static void error(string message) {

        logger.LogError($" ERROR {context.InvocationId} {message}");

    }

    public static void debug(string message) {

        logger.LogDebug($" DEBUG {context.InvocationId} {message}");

    }

    public static void warn(string message) {

        logger.LogWarning($" WARN {context.InvocationId} {message}");

    }

    public static void trace(string message) {

        logger.LogTrace($" TRACE {context.InvocationId} {message}");

    }
}
