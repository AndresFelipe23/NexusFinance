using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("UsuarioId", "EstaActivo", "PeriodoPresupuesto", Name = "IX_Presupuestos_Usuario_Activo")]
public partial class Presupuesto
{
    [Key]
    public Guid PresupuestoId { get; set; }

    public Guid UsuarioId { get; set; }

    [StringLength(100)]
    public string NombrePresupuesto { get; set; } = null!;

    [StringLength(20)]
    public string PeriodoPresupuesto { get; set; } = null!;

    public DateTime FechaInicio { get; set; }

    public DateTime? FechaFin { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal PresupuestoTotal { get; set; }

    public bool? EstaActivo { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [InverseProperty("Presupuesto")]
    public virtual ICollection<CategoriasPresupuesto> CategoriasPresupuestos { get; set; } = new List<CategoriasPresupuesto>();

    [ForeignKey("UsuarioId")]
    [InverseProperty("Presupuestos")]
    public virtual Usuario Usuario { get; set; } = null!;
}
