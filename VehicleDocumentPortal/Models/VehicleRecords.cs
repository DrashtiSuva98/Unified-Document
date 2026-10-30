namespace VehicleDocumentPortal.Models;

public sealed record Document(string Name, string Reference, string Date, string Content);

public sealed record Sale(
    string RegistrationNumber,
    string Make,
    string Model,
    string FuelType,
    int Year,
    string Color,
    string Owner,
    string Dealer,
    string SaleDate,
    decimal Price,
    string Warranty,
    List<Document> Documents);

public sealed record ServiceRecord(
    string Id,
    string Date,
    int OdometerKm,
    string Type,
    string Center,
    string Technician,
    decimal Cost,
    string Notes,
    List<string> Work);

public sealed record ServiceHistory(
    string RegistrationNumber,
    string NextService,
    int NextServiceKm,
    List<ServiceRecord> Records);
