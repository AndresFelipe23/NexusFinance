using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Table("ChecklistViaje")]
[Index("PlanId", "EstaCompletado", "CategoriaChecklist", Name = "IX_ChecklistViaje_Plan_Estado")]
public partial class ChecklistViaje
{
    [Key]
    public Guid ChecklistId { get; set; }

    public Guid PlanId { get; set; }

    [StringLength(300)]
    public string Item { get; set; } = null!;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    [StringLength(50)]
    public string? CategoriaChecklist { get; set; }

    public bool? EstaCompletado { get; set; }

    public DateOnly? FechaLimite { get; set; }

    [StringLength(20)]
    public string? Prioridad { get; set; }

    public int? OrdenVisualizacion { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaCompletado { get; set; }

    [ForeignKey("PlanId")]
    [InverseProperty("ChecklistViajes")]
    public virtual PlanesVacacione Plan { get; set; } = null!;
}
