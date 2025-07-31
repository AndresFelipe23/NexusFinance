using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearCuentaDTO
    {
        public Guid UsuarioId { get; set; }
        public string NombreCuenta { get; set; } = null!;
        public string TipoCuenta { get; set; } = null!;
        public decimal? Saldo { get; set; } = 0.00m;
        public string? Moneda { get; set; } = "COP";
        public string? NombreBanco { get; set; }
        public string? NumeroCuenta { get; set; }
    }
} 