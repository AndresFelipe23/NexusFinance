using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarActividadViajeDTO
    {
        public Guid ActividadId { get; set; }
        public string? NombreActividad { get; set; }
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
    }
}