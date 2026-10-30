using System.Diagnostics;
using VehicleDocumentPortal.Services;
var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
// Ambient ASP.NET scopes include raw request paths (and registration numbers).
// Emit request IDs explicitly instead so normal logs contain route templates only.
builder.Logging.AddJsonConsole(o => { o.IncludeScopes = false; o.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ"; o.UseUtcTimestamp = true; });
builder.Services.AddControllers();
builder.Services.AddSingleton<VehicleDataService>();
var app = builder.Build();
try {
    _ = app.Services.GetRequiredService<VehicleDataService>();
} catch (Exception ex) {
    app.Logger.LogCritical(ex, "Portal startup failed while loading vehicle data");
    throw;
}
app.Use(async (context, next) => {
    var timer = Stopwatch.StartNew();
    context.Response.Headers["X-Request-ID"] = context.TraceIdentifier;
    app.Logger.LogInformation("Request {RequestId} started: {Method}", context.TraceIdentifier, context.Request.Method);
    try { await next(context); }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested) {
        app.Logger.LogWarning("Request {RequestId} cancelled by client", context.TraceIdentifier);
        if (!context.Response.HasStarted) context.Response.StatusCode = 499;
    }
    catch (Exception ex) {
        app.Logger.LogError(ex, "Unhandled failure for request {RequestId}", context.TraceIdentifier);
        if (context.Response.HasStarted) throw;
        context.Response.Clear();
        context.Response.StatusCode = 500;
        context.Response.Headers["X-Request-ID"] = context.TraceIdentifier;
        await context.Response.WriteAsJsonAsync(new { message = "Something went wrong. Please try again.", requestId = context.TraceIdentifier });
    }
    finally {
        app.Logger.Log(context.Response.StatusCode >= 500 ? LogLevel.Error : context.Response.StatusCode >= 400 ? LogLevel.Warning : LogLevel.Information,
            "Request {RequestId} completed: {Method} {Endpoint} returned {StatusCode} in {ElapsedMs} ms", context.TraceIdentifier, context.Request.Method,
            context.GetEndpoint()?.DisplayName ?? "Static asset", context.Response.StatusCode, timer.ElapsedMilliseconds);
    }
});
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapFallback("/api/{**path}", () => Results.NotFound(new { message = "API endpoint not found." }));
app.MapFallbackToFile("index.html");
app.Lifetime.ApplicationStarted.Register(() => app.Logger.LogInformation("Portal started in {Environment}", app.Environment.EnvironmentName));
app.Lifetime.ApplicationStopping.Register(() => app.Logger.LogInformation("Portal shutdown requested"));
app.Run();
