using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Table("PresupuestoViaje")]
[Index("PlanId", Name = "IX_PresupuestoViaje_Plan")]
[Index("PlanId", "CategoriaViajeId", Name = "UQ__Presupue__6E49235A8A5EF6A2", IsUnique = true)]
public partial class PresupuestoViaje
{
    [Key]
    public Guid PresupuestoViajeId { get; set; }

    public Guid PlanId { get; set; }

    public Guid CategoriaViajeId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal PresupuestoEstimado { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? GastoReal { get; set; }

    [StringLength(500)]
    public string? Notas { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [ForeignKey("CategoriaViajeId")]
    [InverseProperty("PresupuestoViajes")]
    public virtual CategoriasGastosViaje CategoriaViaje { get; set; } = null!;

    [ForeignKey("PlanId")]
    [InverseProperty("PresupuestoViajes")]
    public virtual PlanesVacacione Plan { get; set; } = null!;
}
