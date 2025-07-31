using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarContribucionMetaDTO
    {
        public Guid ContribucionId { get; set; }
        public decimal? Monto { get; set; }
        public DateTime? FechaContribucion { get; set; }
        public string? Notas { get; set; }
        public bool ActualizarMetaAutomaticamente { get; set; } = true;
    }
} 