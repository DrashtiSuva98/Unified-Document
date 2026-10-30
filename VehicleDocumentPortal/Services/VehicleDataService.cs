using System.Text.Json;
using VehicleDocumentPortal.Models;

namespace VehicleDocumentPortal.Services;

public sealed class VehicleDataService
{
    private readonly ILogger<VehicleDataService> _logger;
    private readonly List<Sale> _sales;
    private readonly List<ServiceHistory> _services;

    public VehicleDataService(IWebHostEnvironment environment, ILogger<VehicleDataService> logger)
    {
        _logger = logger;
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        _sales = LoadRecords<Sale>(environment.ContentRootPath, "sales.json", options);
        _services = LoadRecords<ServiceHistory>(environment.ContentRootPath, "service.json", options);

        if (_sales.Count == 0 || _sales.Select(s => s.RegistrationNumber).Distinct().Count() != _sales.Count ||
            _services.Select(s => s.RegistrationNumber).Distinct().Count() != _services.Count ||
            !_sales.Select(s => s.RegistrationNumber).ToHashSet().SetEquals(_services.Select(s => s.RegistrationNumber)) ||
            _sales.Any(s => string.IsNullOrWhiteSpace(s.Owner) || s.Price < 0 || s.Documents is null || s.Documents.Any(d => string.IsNullOrWhiteSpace(d.Content))) ||
            _services.Any(s => s.Records is null || s.Records.Any(r => r.Work is null || r.Cost < 0 || r.OdometerKm < 0)))
        {
            throw new InvalidDataException("Vehicle data is empty, duplicated, incomplete or inconsistent between sources.");
        }

        _logger.LogInformation("Vehicle data validated: {SalesCount} sales records and {ServiceCount} service histories", _sales.Count, _services.Count);
    }

    public IReadOnlyList<Sale> Sales => _sales;

    public IReadOnlyList<ServiceHistory> Services => _services;

    private List<T> LoadRecords<T>(string contentRootPath, string filename, JsonSerializerOptions options)
    {
        _logger.LogInformation("Loading data source {Source}", filename);
        var records = JsonSerializer.Deserialize<List<T>>(
            File.ReadAllText(Path.Combine(contentRootPath, "Data", filename)),
            options) ?? throw new InvalidDataException($"Data source {filename} must contain a JSON array.");
        _logger.LogInformation("Loaded {RecordCount} records from {Source}", records.Count, filename);
        return records;
    }
}
