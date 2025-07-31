using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Table("DocumentosViaje")]
[Index("PlanId", "TipoDocumento", Name = "IX_DocumentosViaje_Plan_Tipo")]
public partial class DocumentosViaje
{
    [Key]
    public Guid DocumentoId { get; set; }

    public Guid PlanId { get; set; }

    [StringLength(50)]
    public string TipoDocumento { get; set; } = null!;

    [StringLength(200)]
    public string NombreDocumento { get; set; } = null!;

    [StringLength(100)]
    public string? NumeroDocumento { get; set; }

    public DateOnly? FechaExpedicion { get; set; }

    public DateOnly? FechaVencimiento { get; set; }

    [StringLength(500)]
    public string? UrlArchivo { get; set; }

    [StringLength(500)]
    public string? Notas { get; set; }

    public bool? EsObligatorio { get; set; }

    public bool? EstaVerificado { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [ForeignKey("PlanId")]
    [InverseProperty("DocumentosViajes")]
    public virtual PlanesVacacione Plan { get; set; } = null!;
}
