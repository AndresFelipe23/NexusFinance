using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("CuentaDestinoId", "FechaTransferencia", Name = "IX_Transferencias_CuentaDestino", IsDescending = new[] { false, true })]
[Index("CuentaOrigenId", "FechaTransferencia", Name = "IX_Transferencias_CuentaOrigen", IsDescending = new[] { false, true })]
[Index("UsuarioId", "FechaTransferencia", Name = "IX_Transferencias_Usuario_Fecha", IsDescending = new[] { false, true })]
public partial class Transferencia
{
    [Key]
    public Guid TransferenciaId { get; set; }

    public Guid UsuarioId { get; set; }

    public Guid CuentaOrigenId { get; set; }

    public Guid CuentaDestinoId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Monto { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? ComisionTransferencia { get; set; }

    [StringLength(500)]
    public string? Descripcion { get; set; }

    public DateTime FechaTransferencia { get; set; }

    public DateTime? FechaCreacion { get; set; }

    [ForeignKey("CuentaDestinoId")]
    [InverseProperty("TransferenciaCuentaDestinos")]
    public virtual Cuenta CuentaDestino { get; set; } = null!;

    [ForeignKey("CuentaOrigenId")]
    [InverseProperty("TransferenciaCuentaOrigens")]
    public virtual Cuenta CuentaOrigen { get; set; } = null!;

    [ForeignKey("UsuarioId")]
    [InverseProperty("Transferencia")]
    public virtual Usuario Usuario { get; set; } = null!;
}
