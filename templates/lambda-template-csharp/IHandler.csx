interface IHandler<T>
{
    bool handle(T myEvent, ILogger log);
}