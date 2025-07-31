using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearContribucionMetaDTO
    {
        public Guid MetaId { get; set; }
        public decimal Monto { get; set; }
        public DateTime? FechaContribucion { get; set; }
        public string? Notas { get; set; }
        public Guid? TransaccionId { get; set; }
        public bool ActualizarMetaAutomaticamente { get; set; } = true;
    }
} 