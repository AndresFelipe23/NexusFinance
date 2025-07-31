using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearPresupuestoViajeDTO
    {
        public Guid PlanId { get; set; }
        public Guid CategoriaViajeId { get; set; }
        public decimal PresupuestoEstimado { get; set; }
        public string? Notas { get; set; }
    }
} 