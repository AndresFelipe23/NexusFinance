using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ActualizarChecklistViajeDTO
    {
        public Guid ChecklistId { get; set; }
        public string? Item { get; set; }
        public string? Descripcion { get; set; }
        public string? CategoriaChecklist { get; set; }
        public bool? EstaCompletado { get; set; }
        public DateTime? FechaLimite { get; set; }
        public string? Prioridad { get; set; }
        public int? OrdenVisualizacion { get; set; }
        public bool CambiarFechaLimite { get; set; } = false;
    }
} 