using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("Pais", "Ciudad", "EstadoPlan", Name = "IX_PlanesVacaciones_Destino")]
[Index("FechaInicio", "FechaFin", "EstadoPlan", Name = "IX_PlanesVacaciones_Fechas")]
[Index("UsuarioId", "EstadoPlan", Name = "IX_PlanesVacaciones_Usuario_Estado")]
public partial class PlanesVacacione
{
    [Key]
    public Guid PlanId { get; set; }

    public Guid UsuarioId { get; set; }

    [StringLength(100)]
    public string NombrePlan { get; set; } = null!;

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    [StringLength(200)]
    public string Destino { get; set; } = null!;

    [StringLength(100)]
    public string Pais { get; set; } = null!;

    [StringLength(100)]
    public string? Ciudad { get; set; }

    public DateTime FechaInicio { get; set; }

    public DateTime FechaFin { get; set; }

    public int? CantidadPersonas { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? PresupuestoEstimado { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? PresupuestoReal { get; set; }

    [StringLength(3)]
    public string? MonedaDestino { get; set; }

    [Column(TypeName = "decimal(10, 4)")]
    public decimal? TasaCambio { get; set; }

    [StringLength(20)]
    public string? EstadoPlan { get; set; }

    public bool? EsViajeInternacional { get; set; }

    public Guid? MetaFinancieraId { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [InverseProperty("Plan")]
    public virtual ICollection<ActividadesViaje> ActividadesViajes { get; set; } = new List<ActividadesViaje>();

    [InverseProperty("Plan")]
    public virtual ICollection<ChecklistViaje> ChecklistViajes { get; set; } = new List<ChecklistViaje>();

    [InverseProperty("Plan")]
    public virtual ICollection<DocumentosViaje> DocumentosViajes { get; set; } = new List<DocumentosViaje>();

    [InverseProperty("Plan")]
    public virtual ICollection<GastosViaje> GastosViajes { get; set; } = new List<GastosViaje>();

    [ForeignKey("MetaFinancieraId")]
    [InverseProperty("PlanesVacaciones")]
    public virtual MetasFinanciera? MetaFinanciera { get; set; }

    [InverseProperty("Plan")]
    public virtual ICollection<PresupuestoViaje> PresupuestoViajes { get; set; } = new List<PresupuestoViaje>();

    [ForeignKey("UsuarioId")]
    [InverseProperty("PlanesVacaciones")]
    public virtual Usuario Usuario { get; set; } = null!;
}
