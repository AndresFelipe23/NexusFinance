using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarCategoriaPresupuestoDTO
    {
        public Guid CategoriaPresupuestoId { get; set; }
        public decimal? MontoAsignado { get; set; }
    }
} 