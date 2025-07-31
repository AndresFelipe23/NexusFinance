using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearTransaccionDTO
    {
        public Guid UsuarioId { get; set; }
        public Guid CuentaId { get; set; }
        public Guid? CategoriaId { get; set; }
        public decimal Monto { get; set; }
        public string TipoTransaccion { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? Notas { get; set; }
        public DateTime FechaTransaccion { get; set; }
        public Guid? TransaccionRecurrenteId { get; set; }
        public string? UrlRecibo { get; set; }
        public bool EstaConciliado { get; set; } = false;
    }
} 