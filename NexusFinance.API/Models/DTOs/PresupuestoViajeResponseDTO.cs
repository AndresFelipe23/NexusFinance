using System;

namespace NexusFinance.API.Models.DTOs
{
    public class PresupuestoViajeResponseDTO
    {
        public Guid PresupuestoViajeId { get; set; }
        public Guid PlanId { get; set; }
        public Guid CategoriaViajeId { get; set; }
        public string? NombreCategoria { get; set; }
        public string? Color { get; set; }
        public string? Icono { get; set; }
        public decimal PresupuestoEstimado { get; set; }
        public decimal? GastoReal { get; set; }
        public string? Notas { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public decimal? SaldoDisponible { get; set; }
        public decimal? PorcentajeUsado { get; set; }
        public bool? ExcedioPresupuesto { get; set; }
        public int? CantidadGastos { get; set; }
        public DateTime? UltimoGasto { get; set; }
    }
} 