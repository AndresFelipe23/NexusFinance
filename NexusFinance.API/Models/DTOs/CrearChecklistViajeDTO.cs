using System;

namespace NexusFinance.API.Models.DTOs
{
    public class CrearChecklistViajeDTO
    {
        public Guid PlanId { get; set; }
        public string Item { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? CategoriaChecklist { get; set; } = "general";
        public DateTime? FechaLimite { get; set; }
        public string? Prioridad { get; set; } = "media";
        public int? OrdenVisualizacion { get; set; }
    }
} 