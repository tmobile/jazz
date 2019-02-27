public class Logger {

    private static ILogger logger;

    public static void init(ILogger azureLogger) {

        logger = azureLogger;
    }

    public static void info(string message) {

        logger.LogInformation(message);

    }

    public static void error(string message) {

        logger.LogError(message);

    }

    public static void debug(string message) {

        logger.LogDebug(message);

    }

    public static void warn(string message) {

        logger.LogWarning(message);

    }

    public static void trace(string message) {

        logger.LogTrace(message);

    }
}
