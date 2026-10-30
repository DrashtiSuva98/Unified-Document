using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using VehicleDocumentPortal.Models;
using VehicleDocumentPortal.Services;

namespace VehicleDocumentPortal.Controllers;

[ApiController]
[Route("api")]
public sealed class VehiclesController : ControllerBase
{
    private static readonly Regex RegistrationNumberPattern = new(
        "^(?:[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}|[0-9]{2}BH[0-9]{4}[A-Z]{1,2})$",
        RegexOptions.Compiled);

    private readonly VehicleDataService _vehicleData;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(VehicleDataService vehicleData, ILogger<VehiclesController> logger)
    {
        _vehicleData = vehicleData;
        _logger = logger;
    }

    [HttpGet("vehicles")]
    public IActionResult GetVehicles()
    {
        return Ok(_vehicleData.Sales.Select(s => new { s.RegistrationNumber, s.Make, s.Model, s.Year }));
    }

    [HttpGet("sales/{registrationNumber}")]
    public IActionResult GetSale(string registrationNumber)
    {
        return Lookup(
            registrationNumber,
            _vehicleData.Sales,
            s => s.RegistrationNumber,
            "sales");
    }

    [HttpGet("services/{registrationNumber}")]
    public IActionResult GetServiceHistory(string registrationNumber)
    {
        return Lookup(
            registrationNumber,
            _vehicleData.Services,
            s => s.RegistrationNumber,
            "services");
    }

    [HttpGet("health")]
    public IActionResult GetHealth()
    {
        return Ok(new { status = "healthy", vehicles = _vehicleData.Sales.Count });
    }

    private IActionResult Lookup<T>(
        string registrationNumber,
        IReadOnlyList<T> records,
        Func<T, string> key,
        string source)
    {
        registrationNumber = Regex.Replace(registrationNumber, @"[\s-]", "").ToUpperInvariant();
        if (!RegistrationNumberPattern.IsMatch(registrationNumber))
        {
            _logger.LogWarning(
                "Request {RequestId}: {Source} lookup rejected: invalid registration format",
                HttpContext.TraceIdentifier,
                source);
            return BadRequest(new { message = "Enter a registration number such as MH12AB1234. Spaces and hyphens are accepted." });
        }

        var record = records.FirstOrDefault(r => key(r) == registrationNumber);
        if (record is null)
        {
            _logger.LogWarning(
                "Request {RequestId}: {Source} lookup: record not found",
                HttpContext.TraceIdentifier,
                source);
            return NotFound(new { message = "No vehicle record exists for this registration number." });
        }

        _logger.LogInformation(
            "Request {RequestId}: {Source} lookup succeeded",
            HttpContext.TraceIdentifier,
            source);
        return Ok(record);
    }
}
