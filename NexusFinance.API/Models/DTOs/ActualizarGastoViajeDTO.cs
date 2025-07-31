using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarGastoViajeDTO
    {
        public Guid GastoViajeId { get; set; }
        public Guid? CategoriaViajeId { get; set; }
        public decimal? Monto { get; set; }
        public string? MonedaGasto { get; set; }
        public string? Descripcion { get; set; }
        public DateTime? FechaGasto { get; set; }
        public string? Ubicacion { get; set; }
        public int? NumeroPersonas { get; set; }
        public Guid? ActividadId { get; set; }
        public decimal? TasaCambioUsada { get; set; }
        public string? UrlRecibo { get; set; }
        public string? Notas { get; set; }
        public bool CambiarActividad { get; set; } = false;
        public bool RecalcularMontoLocal { get; set; } = false;
    }
} 