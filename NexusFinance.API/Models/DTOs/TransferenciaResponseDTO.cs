using System;

namespace NexusFinance.API.Models.DTOs
{
    public class TransferenciaResponseDTO
    {
        public Guid TransferenciaId { get; set; }
        public Guid UsuarioId { get; set; }
        public Guid CuentaOrigenId { get; set; }
        public string? NombreCuentaOrigen { get; set; }
        public string? TipoCuentaOrigen { get; set; }
        public string? BancoCuentaOrigen { get; set; }
        public Guid CuentaDestinoId { get; set; }
        public string? NombreCuentaDestino { get; set; }
        public string? TipoCuentaDestino { get; set; }
        public string? BancoCuentaDestino { get; set; }
        public decimal Monto { get; set; }
        public decimal? ComisionTransferencia { get; set; }
        public string? Descripcion { get; set; }
        public DateTime FechaTransferencia { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public decimal MontoTotal { get; set; }
    }
} 