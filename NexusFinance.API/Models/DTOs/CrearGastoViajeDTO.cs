using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearGastoViajeDTO
    {
        public Guid PlanId { get; set; }
        public Guid CategoriaViajeId { get; set; }
        public decimal Monto { get; set; }
        public string MonedaGasto { get; set; } = null!;
        public string Descripcion { get; set; } = null!;
        public DateTime? FechaGasto { get; set; }
        public string? Ubicacion { get; set; }
        public int? NumeroPersonas { get; set; } = 1;
        public Guid? ActividadId { get; set; }
        public Guid? TransaccionId { get; set; }
        public decimal? TasaCambioUsada { get; set; }
        public string? UrlRecibo { get; set; }
        public string? Notas { get; set; }
    }
} 