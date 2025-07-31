using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CategoriaPresupuestoResponseDTO
    {
        public Guid CategoriaPresupuestoId { get; set; }
        public Guid PresupuestoId { get; set; }
        public string? NombrePresupuesto { get; set; }
        public string? PeriodoPresupuesto { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public Guid CategoriaId { get; set; }
        public string? NombreCategoria { get; set; }
        public string? Color { get; set; }
        public string? Icono { get; set; }
        public decimal MontoAsignado { get; set; }
        public decimal? MontoGastado { get; set; }
        public decimal? MontoRestante { get; set; }
        public decimal? PorcentajeGastado { get; set; }
        public string? EstadoCategoria { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public int? DiasRestantes { get; set; }
        public decimal? PromedioGastoDiario { get; set; }
        public int? NumeroTransacciones { get; set; }
    }
} 