using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CuentaResponseDTO
    {
        public Guid CuentaId { get; set; }
        public Guid UsuarioId { get; set; }
        public string NombreCuenta { get; set; } = null!;
        public string TipoCuenta { get; set; } = null!;
        public decimal? Saldo { get; set; }
        public string? Moneda { get; set; }
        public string? NombreBanco { get; set; }
        public string? NumeroCuenta { get; set; }
        public bool? EstaActivo { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
} 