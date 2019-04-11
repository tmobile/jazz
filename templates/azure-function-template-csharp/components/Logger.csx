public class Logger {

    private static ILogger logger;
    private static ExecutionContext context;

    public static void init(ILogger azureLogger, ExecutionContext executionContext) {

        logger = azureLogger;
        context = executionContext;
    }

    public static void info(string message) {

        logger.LogInformation($"{context.InvocationId} {message}");

    }

    public static void error(string message) {

        logger.LogError($"{context.InvocationId} {message}");

    }

    public static void debug(string message) {

        logger.LogDebug($"{context.InvocationId} {message}");

    }

    public static void warn(string message) {

        logger.LogWarning($"{context.InvocationId} {message}");

    }

    public static void trace(string message) {

        logger.LogTrace($"{context.InvocationId} {message}");

    }
}
