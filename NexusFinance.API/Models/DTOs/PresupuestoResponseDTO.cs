using System;

namespace NexusFinance.API.Models.DTOs
{
    public class PresupuestoResponseDTO
    {
        public Guid PresupuestoId { get; set; }
        public Guid UsuarioId { get; set; }
        public string NombrePresupuesto { get; set; } = null!;
        public string PeriodoPresupuesto { get; set; } = null!;
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public decimal PresupuestoTotal { get; set; }
        public bool? EstaActivo { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
    }
} 