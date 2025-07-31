using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarTransaccionDTO
    {
        public Guid TransaccionId { get; set; }
        public Guid? CuentaId { get; set; }
        public Guid? CategoriaId { get; set; }
        public decimal? Monto { get; set; }
        public string? Descripcion { get; set; }
        public string? Notas { get; set; }
        public DateTime? FechaTransaccion { get; set; }
        public string? UrlRecibo { get; set; }
        public bool? EstaConciliado { get; set; }
    }
} 