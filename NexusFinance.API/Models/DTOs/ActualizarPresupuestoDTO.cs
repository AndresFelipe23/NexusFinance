using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarPresupuestoDTO
    {
        public Guid PresupuestoId { get; set; }
        public string? NombrePresupuesto { get; set; }
        public string? PeriodoPresupuesto { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public decimal? PresupuestoTotal { get; set; }
        public bool? EstaActivo { get; set; }
    }
} 