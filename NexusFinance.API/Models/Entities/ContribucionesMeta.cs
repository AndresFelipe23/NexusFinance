using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("MetaId", "FechaContribucion", Name = "IX_ContribucionesMetas_Meta_Fecha", IsDescending = new[] { false, true })]
public partial class ContribucionesMeta
{
    [Key]
    public Guid ContribucionId { get; set; }

    public Guid MetaId { get; set; }

    public Guid? TransaccionId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Monto { get; set; }

    public DateTime FechaContribucion { get; set; }

    [StringLength(500)]
    public string? Notas { get; set; }

    public DateTime? FechaCreacion { get; set; }

    [ForeignKey("MetaId")]
    [InverseProperty("ContribucionesMeta")]
    public virtual MetasFinanciera Meta { get; set; } = null!;

    [ForeignKey("TransaccionId")]
    [InverseProperty("ContribucionesMeta")]
    public virtual Transaccione? Transaccion { get; set; }
}
