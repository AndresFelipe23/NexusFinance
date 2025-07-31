using System;

namespace NexusFinance.API.Models.DTOs
{
    public class PlanVacacionesResponseDTO
    {
        public Guid PlanId { get; set; }
        public Guid UsuarioId { get; set; }
        public string NombrePlan { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string Destino { get; set; } = null!;
        public string Pais { get; set; } = null!;
        public string? Ciudad { get; set; }
        public DateOnly FechaInicio { get; set; }
        public DateOnly FechaFin { get; set; }
        public int? CantidadPersonas { get; set; }
        public decimal? PresupuestoEstimado { get; set; }
        public decimal? PresupuestoReal { get; set; }
        public string? MonedaDestino { get; set; }
        public decimal? TasaCambio { get; set; }
        public string? EstadoPlan { get; set; }
        public bool? EsViajeInternacional { get; set; }
        public Guid? MetaFinancieraId { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
} 