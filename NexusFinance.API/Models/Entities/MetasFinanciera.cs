using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("TipoMeta", "EstaCompletada", Name = "IX_MetasFinancieras_Tipo")]
[Index("UsuarioId", "EstaCompletada", Name = "IX_MetasFinancieras_Usuario_Estado")]
public partial class MetasFinanciera
{
    [Key]
    public Guid MetaId { get; set; }

    public Guid UsuarioId { get; set; }

    [StringLength(100)]
    public string NombreMeta { get; set; } = null!;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal MontoObjetivo { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? MontoActual { get; set; }

    public DateTime? FechaObjetivo { get; set; }

    [StringLength(50)]
    public string TipoMeta { get; set; } = null!;

    public Guid? CuentaId { get; set; }

    public bool? EstaCompletada { get; set; }

    public DateTime? FechaComplecion { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [InverseProperty("Meta")]
    public virtual ICollection<ContribucionesMeta> ContribucionesMeta { get; set; } = new List<ContribucionesMeta>();

    [ForeignKey("CuentaId")]
    [InverseProperty("MetasFinancieras")]
    public virtual Cuenta? Cuenta { get; set; }

    [InverseProperty("MetaFinanciera")]
    public virtual ICollection<PlanesVacacione> PlanesVacaciones { get; set; } = new List<PlanesVacacione>();

    [ForeignKey("UsuarioId")]
    [InverseProperty("MetasFinancieras")]
    public virtual Usuario Usuario { get; set; } = null!;
}
