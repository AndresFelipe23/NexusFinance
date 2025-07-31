using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarPlanVacacionesDTO
    {
        public Guid PlanId { get; set; }
        public string? NombrePlan { get; set; }
        public string? Descripcion { get; set; }
        public string? Destino { get; set; }
        public string? Pais { get; set; }
        public string? Ciudad { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public int? CantidadPersonas { get; set; }
        public decimal? PresupuestoEstimado { get; set; }
        public decimal? PresupuestoReal { get; set; }
        public string? MonedaDestino { get; set; }
        public decimal? TasaCambio { get; set; }
        public string? EstadoPlan { get; set; }
        public bool? EsViajeInternacional { get; set; }
        public Guid? MetaFinancieraId { get; set; }
    }
} 