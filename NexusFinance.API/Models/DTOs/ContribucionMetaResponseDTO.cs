using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ContribucionMetaResponseDTO
    {
        public Guid ContribucionId { get; set; }
        public Guid MetaId { get; set; }
        public string? NombreMeta { get; set; }
        public string? TipoMeta { get; set; }
        public Guid? TransaccionId { get; set; }
        public decimal Monto { get; set; }
        public DateTime FechaContribucion { get; set; }
        public string? Notas { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public decimal? MontoActual { get; set; }
        public decimal? MontoObjetivo { get; set; }
        public decimal? MontoFaltante { get; set; }
        public decimal? PorcentajeCompletado { get; set; }
        public bool? EstaCompletada { get; set; }
        public DateTime? FechaComplecion { get; set; }
    }
} 