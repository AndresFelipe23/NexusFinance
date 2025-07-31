using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarDocumentoViajeDTO
    {
        public Guid DocumentoId { get; set; }
        public string? TipoDocumento { get; set; }
        public string? NombreDocumento { get; set; }
        public string? NumeroDocumento { get; set; }
        public DateTime? FechaExpedicion { get; set; }
        public DateTime? FechaVencimiento { get; set; }
        public string? UrlArchivo { get; set; }
        public string? Notas { get; set; }
        public bool? EsObligatorio { get; set; }
        public bool? EstaVerificado { get; set; }
        public bool CambiarNumero { get; set; } = false;
        public bool CambiarFechas { get; set; } = false;
    }
} 