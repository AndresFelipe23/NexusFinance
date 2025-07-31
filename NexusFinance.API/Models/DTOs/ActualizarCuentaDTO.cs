using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarCuentaDTO
    {
        public Guid CuentaId { get; set; }
        public string? NombreCuenta { get; set; }
        public string? TipoCuenta { get; set; }
        public string? Moneda { get; set; }
        public string? NombreBanco { get; set; }
        public string? NumeroCuenta { get; set; }
        public bool? EstaActivo { get; set; }
    }
} 