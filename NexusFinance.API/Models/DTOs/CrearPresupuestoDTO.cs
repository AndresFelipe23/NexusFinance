using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearPresupuestoDTO
    {
        public Guid UsuarioId { get; set; }
        public string NombrePresupuesto { get; set; } = null!;
        public string PeriodoPresupuesto { get; set; } = null!;
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public decimal PresupuestoTotal { get; set; }
    }
} 