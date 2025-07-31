using System;

namespace NexusFinance.API.Models.DTOs
{
    public class GastoViajeResponseDTO
    {
        public Guid GastoViajeId { get; set; }
        public Guid PlanId { get; set; }
        public Guid? TransaccionId { get; set; }
        public Guid CategoriaViajeId { get; set; }
        public Guid? ActividadId { get; set; }
        public string? NombreCategoria { get; set; }
        public string? Color { get; set; }
        public string? Icono { get; set; }
        public string? NombreActividad { get; set; }
        public decimal Monto { get; set; }
        public string MonedaGasto { get; set; } = null!;
        public decimal? MontoEnMonedaLocal { get; set; }
        public decimal? TasaCambioUsada { get; set; }
        public string? Descripcion { get; set; }
        public DateTime FechaGasto { get; set; }
        public string? Ubicacion { get; set; }
        public int? NumeroPersonas { get; set; }
        public string? UrlRecibo { get; set; }
        public string? Notas { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public decimal? MontoPorPersona { get; set; }
        public decimal? MontoLocalPorPersona { get; set; }
    }
} 