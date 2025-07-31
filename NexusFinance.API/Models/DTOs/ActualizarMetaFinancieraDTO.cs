using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarMetaFinancieraDTO
    {
        public Guid MetaId { get; set; }
        public string? NombreMeta { get; set; }
        public string? Descripcion { get; set; }
        public decimal? MontoObjetivo { get; set; }
        public decimal? MontoActual { get; set; }
        public DateTime? FechaObjetivo { get; set; }
        public string? TipoMeta { get; set; }
        public Guid? CuentaId { get; set; }
        public bool? EstaCompletada { get; set; }
        public DateTime? FechaComplecion { get; set; }
    }
} 