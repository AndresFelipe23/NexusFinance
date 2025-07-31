using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearMetaFinancieraDTO
    {
        public Guid UsuarioId { get; set; }
        public string NombreMeta { get; set; } = null!;
        public string? Descripcion { get; set; }
        public decimal MontoObjetivo { get; set; }
        public decimal? MontoActual { get; set; }
        public DateTime? FechaObjetivo { get; set; }
        public string TipoMeta { get; set; } = null!;
        public Guid? CuentaId { get; set; }
    }
} 