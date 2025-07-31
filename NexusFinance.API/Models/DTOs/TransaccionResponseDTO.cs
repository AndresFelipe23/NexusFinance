using System;

namespace NexusFinance.API.Models.DTOs
{
    public class TransaccionResponseDTO
    {
        public Guid TransaccionId { get; set; }
        public Guid UsuarioId { get; set; }
        public Guid CuentaId { get; set; }
        public string? NombreCuenta { get; set; }
        public string? TipoCuenta { get; set; }
        public string? NombreBanco { get; set; }
        public Guid CategoriaId { get; set; }
        public string? NombreCategoria { get; set; }
        public string? TipoCategoria { get; set; }
        public string? Color { get; set; }
        public string? Icono { get; set; }
        public decimal Monto { get; set; }
        public string TipoTransaccion { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string? Notas { get; set; }
        public DateTime FechaTransaccion { get; set; }
        public Guid? TransaccionRecurrenteId { get; set; }
        public string? DescripcionRecurrente { get; set; }
        public string? UrlRecibo { get; set; }
        public bool? EstaConciliado { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public decimal? SaldoActualCuenta { get; set; }
        public string? Moneda { get; set; }
    }
} 