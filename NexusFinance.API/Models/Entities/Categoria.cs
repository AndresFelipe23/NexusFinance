using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("UsuarioId", "TipoCategoria", "EstaActivo", Name = "IX_Categorias_UsuarioId_Tipo")]
public partial class Categoria
{
    [Key]
    public Guid CategoriaId { get; set; }

    public Guid UsuarioId { get; set; }

    [StringLength(100)]
    public string NombreCategoria { get; set; } = null!;

    [StringLength(20)]
    public string TipoCategoria { get; set; } = null!;

    // Tipos de categoría permitidos
    public static readonly string[] TiposPermitidos = {
        "ingreso", "gasto", "transferencia", "inversion", "ahorro", "credito", "deuda"
    };

    public Guid? CategoriaIdPadre { get; set; }

    [StringLength(7)]
    public string? Color { get; set; }

    [StringLength(50)]
    public string? Icono { get; set; }

    public bool? EstaActivo { get; set; }

    public DateTime? FechaCreacion { get; set; }

    [ForeignKey("CategoriaIdPadre")]
    [InverseProperty("InverseCategoriaIdPadreNavigation")]
    public virtual Categoria? CategoriaIdPadreNavigation { get; set; }

    [InverseProperty("Categoria")]
    public virtual ICollection<CategoriasPresupuesto> CategoriasPresupuestos { get; set; } = new List<CategoriasPresupuesto>();

    [InverseProperty("CategoriaIdPadreNavigation")]
    public virtual ICollection<Categoria> InverseCategoriaIdPadreNavigation { get; set; } = new List<Categoria>();

    [InverseProperty("Categoria")]
    public virtual ICollection<Transaccione> Transacciones { get; set; } = new List<Transaccione>();

    [InverseProperty("Categoria")]
    public virtual ICollection<TransaccionesRecurrente> TransaccionesRecurrentes { get; set; } = new List<TransaccionesRecurrente>();

    [ForeignKey("UsuarioId")]
    [InverseProperty("Categoria")]
    public virtual Usuario Usuario { get; set; } = null!;
}
