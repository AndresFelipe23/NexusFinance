using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Table("GastosViaje")]
[Index("CategoriaViajeId", "FechaGasto", Name = "IX_GastosViaje_Categoria", IsDescending = new[] { false, true })]
[Index("PlanId", "FechaGasto", Name = "IX_GastosViaje_Plan_Fecha", IsDescending = new[] { false, true })]
public partial class GastosViaje
{
    [Key]
    public Guid GastoViajeId { get; set; }

    public Guid PlanId { get; set; }

    public Guid? TransaccionId { get; set; }

    public Guid CategoriaViajeId { get; set; }

    public Guid? ActividadId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Monto { get; set; }

    [StringLength(3)]
    public string MonedaGasto { get; set; } = null!;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? MontoEnMonedaLocal { get; set; }

    [Column(TypeName = "decimal(10, 4)")]
    public decimal? TasaCambioUsada { get; set; }

    [StringLength(500)]
    public string? Descripcion { get; set; }

    public DateTime FechaGasto { get; set; }

    [StringLength(300)]
    public string? Ubicacion { get; set; }

    public int? NumeroPersonas { get; set; }

    [StringLength(500)]
    public string? UrlRecibo { get; set; }

    [StringLength(1000)]
    public string? Notas { get; set; }

    public DateTime? FechaCreacion { get; set; }

    [ForeignKey("ActividadId")]
    [InverseProperty("GastosViajes")]
    public virtual ActividadesViaje? Actividad { get; set; }

    [ForeignKey("CategoriaViajeId")]
    [InverseProperty("GastosViajes")]
    public virtual CategoriasGastosViaje CategoriaViaje { get; set; } = null!;

    [ForeignKey("PlanId")]
    [InverseProperty("GastosViajes")]
    public virtual PlanesVacacione Plan { get; set; } = null!;

    [ForeignKey("TransaccionId")]
    [InverseProperty("GastosViajes")]
    public virtual Transaccione? Transaccion { get; set; }
}
