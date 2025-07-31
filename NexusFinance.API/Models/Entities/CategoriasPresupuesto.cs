using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Table("CategoriasPresupuesto")]
[Index("CategoriaId", Name = "IX_CategoriasPresupuesto_Categoria")]
[Index("PresupuestoId", Name = "IX_CategoriasPresupuesto_Presupuesto")]
public partial class CategoriasPresupuesto
{
    [Key]
    public Guid CategoriaPresupuestoId { get; set; }

    public Guid PresupuestoId { get; set; }

    public Guid CategoriaId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal MontoAsignado { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? MontoGastado { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [ForeignKey("CategoriaId")]
    [InverseProperty("CategoriasPresupuestos")]
    public virtual Categoria Categoria { get; set; } = null!;

    [ForeignKey("PresupuestoId")]
    [InverseProperty("CategoriasPresupuestos")]
    public virtual Presupuesto Presupuesto { get; set; } = null!;
}
