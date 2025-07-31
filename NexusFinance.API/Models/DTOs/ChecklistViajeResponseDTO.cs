using System;

namespace NexusFinance.API.Models.DTOs
{
    public class ChecklistViajeResponseDTO
    {
        public Guid ChecklistId { get; set; }
        public Guid PlanId { get; set; }
        public string Item { get; set; } = null!;
        public string? Descripcion { get; set; }
        public string? CategoriaChecklist { get; set; }
        public bool? EstaCompletado { get; set; }
        public DateOnly? FechaLimite { get; set; }
        public string? Prioridad { get; set; }
        public int? OrdenVisualizacion { get; set; }
        public DateTime? FechaCreacion { get; set; }
        public DateTime? FechaCompletado { get; set; }
        public string? NombrePlan { get; set; }
        public string? Destino { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public string? EstadoPlan { get; set; }
        public int? DiasParaVencimiento { get; set; }
        public int? EstaVencido { get; set; }
        public string? EstadoDescriptivo { get; set; }
    }
} 