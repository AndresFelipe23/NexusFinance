using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActividadViajeResponseDTO
    {
        public Guid ActividadId { get; set; }
        public Guid PlanId { get; set; }
        public string NombreActividad { get; set; } = null!;
        public string? Descripcion { get; set; }
        public DateTime? FechaHoraInicio { get; set; }
        public DateTime? FechaHoraFin { get; set; }
        public decimal? CostoEstimado { get; set; }
        public decimal? CostoReal { get; set; }
        public string? Ubicacion { get; set; }
        public Guid? CategoriaViajeId { get; set; }
        public string? Prioridad { get; set; }
        public string? EstadoActividad { get; set; }
        public string? UrlReferencia { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaActualizacion { get; set; }
        public string? NombreCategoria { get; set; }
    }
} 