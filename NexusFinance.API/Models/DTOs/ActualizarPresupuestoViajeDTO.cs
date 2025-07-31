using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarPresupuestoViajeDTO
    {
        public Guid PresupuestoViajeId { get; set; }
        public decimal? PresupuestoEstimado { get; set; }
        public decimal? GastoReal { get; set; }
        public string? Notas { get; set; }
        public bool ActualizarSoloNotas { get; set; } = false;
    }
} 