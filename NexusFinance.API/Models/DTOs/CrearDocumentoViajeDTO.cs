using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearDocumentoViajeDTO
    {
        public Guid PlanId { get; set; }
        public string TipoDocumento { get; set; } = null!;
        public string NombreDocumento { get; set; } = null!;
        public string? NumeroDocumento { get; set; }
        public DateTime? FechaExpedicion { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public string? UrlArchivo { get; set; }
        public string? Notas { get; set; }
        public bool? EsObligatorio { get; set; }
        public bool? EstaVerificado { get; set; }
    }
} 