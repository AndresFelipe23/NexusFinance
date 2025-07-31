using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearPlanVacacionesDTO
    {
        public Guid UsuarioId { get; set; }
        public string NombrePlan { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string Destino { get; set; } = null!;
        public string Pais { get; set; } = null!;
        public string? Ciudad { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public int? CantidadPersonas { get; set; }
        public decimal? PresupuestoEstimado { get; set; }
        public string? MonedaDestino { get; set; }
        public decimal? TasaCambio { get; set; }
        public bool? EsViajeInternacional { get; set; }
        public Guid? MetaFinancieraId { get; set; }
    }
} 