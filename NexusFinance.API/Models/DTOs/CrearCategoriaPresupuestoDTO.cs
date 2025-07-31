using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearCategoriaPresupuestoDTO
    {
        public Guid PresupuestoId { get; set; }
        public Guid CategoriaId { get; set; }
        public decimal MontoAsignado { get; set; }
    }
} 