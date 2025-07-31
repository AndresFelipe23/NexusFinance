using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarTransferenciaDTO
    {
        public Guid TransferenciaId { get; set; }
        public Guid? CuentaOrigenId { get; set; }
        public Guid? CuentaDestinoId { get; set; }
        public decimal? Monto { get; set; }
        public decimal? ComisionTransferencia { get; set; }
        public string? Descripcion { get; set; }
        public DateTime? FechaTransferencia { get; set; }
    }
} 