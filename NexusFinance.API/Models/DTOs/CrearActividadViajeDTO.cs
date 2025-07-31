using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearActividadViajeDTO
    {
        public Guid PlanId { get; set; }
        public string NombreActividad { get; set; } = null!;
        public string? Descripcion { get; set; }
        public DateTime? FechaHoraInicio { get; set; }
        public DateTime? FechaHoraFin { get; set; }
        public decimal CostoEstimado { get; set; }
        public string? Ubicacion { get; set; }
        public Guid? CategoriaViajeId { get; set; }
        public string Prioridad { get; set; } = "media";
        public string? UrlReferencia { get; set; }
    }
}