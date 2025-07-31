using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Table("CategoriasGastosViaje")]
[Index("EstaActivo", "OrdenVisualizacion", Name = "IX_CategoriasGastosViaje_Activo_Orden")]
[Index("NombreCategoria", Name = "UQ__Categori__A21FBE9F2AC1D009", IsUnique = true)]
public partial class CategoriasGastosViaje
{
    [Key]
    public Guid CategoriaViajeId { get; set; }

    [StringLength(100)]
    public string NombreCategoria { get; set; } = null!;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    [StringLength(50)]
    public string? Icono { get; set; }

    [StringLength(7)]
    public string? Color { get; set; }

    public bool? EsObligatoria { get; set; }

    public int? OrdenVisualizacion { get; set; }

    public bool? EstaActivo { get; set; }

    public DateTime? FechaCreacion { get; set; }

    [InverseProperty("CategoriaViaje")]
    public virtual ICollection<ActividadesViaje> ActividadesViajes { get; set; } = new List<ActividadesViaje>();

    [InverseProperty("CategoriaViaje")]
    public virtual ICollection<GastosViaje> GastosViajes { get; set; } = new List<GastosViaje>();

    [InverseProperty("CategoriaViaje")]
    public virtual ICollection<PresupuestoViaje> PresupuestoViajes { get; set; } = new List<PresupuestoViaje>();
}
