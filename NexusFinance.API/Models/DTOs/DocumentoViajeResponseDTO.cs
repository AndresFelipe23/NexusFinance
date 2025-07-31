using System;

namespace NexusFinance.API.Models.DTOs
{
    public class DocumentoViajeResponseDTO
    {
        public Guid DocumentoId { get; set; }
        public Guid PlanId { get; set; }
        public string TipoDocumento { get; set; } = null!;
        public string NombreDocumento { get; set; } = null!;
        public string? NumeroDocumento { get; set; }
        public DateOnly? FechaExpedicion { get; set; }
        public DateOnly? FechaVencimiento { get; set; }
        public string? UrlArchivo { get; set; }
        public string? Notas { get; set; }
        public bool? EsObligatorio { get; set; }
        public bool? EstaVerificado { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        // Campos adicionales de SPs
        public int? DiasParaVencimiento { get; set; }
        public bool? EstaVencido { get; set; }
        public bool? VenceAntesDelViaje { get; set; }
        public bool? RequiereRenovacion { get; set; }
        public string? EstadoDescriptivo { get; set; }
    }
} 