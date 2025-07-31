using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Table("ActividadesViaje")]
[Index("EstadoActividad", Name = "IX_ActividadesViaje_Estado")]
[Index("PlanId", "FechaHoraInicio", Name = "IX_ActividadesViaje_Plan_Fecha")]
public partial class ActividadesViaje
{
    [Key]
    public Guid ActividadId { get; set; }

    public Guid PlanId { get; set; }

    [StringLength(200)]
    public string NombreActividad { get; set; } = null!;

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    public DateTime? FechaHoraInicio { get; set; }

    public DateTime? FechaHoraFin { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? CostoEstimado { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? CostoReal { get; set; }

    [StringLength(300)]
    public string? Ubicacion { get; set; }

    public Guid? CategoriaViajeId { get; set; }

    [StringLength(20)]
    public string? Prioridad { get; set; }

    [StringLength(20)]
    public string? EstadoActividad { get; set; }

    [StringLength(500)]
    public string? UrlReferencia { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [ForeignKey("CategoriaViajeId")]
    [InverseProperty("ActividadesViajes")]
    public virtual CategoriasGastosViaje? CategoriaViaje { get; set; }

    [InverseProperty("Actividad")]
    public virtual ICollection<GastosViaje> GastosViajes { get; set; } = new List<GastosViaje>();

    [ForeignKey("PlanId")]
    [InverseProperty("ActividadesViajes")]
    public virtual PlanesVacacione Plan { get; set; } = null!;
}
