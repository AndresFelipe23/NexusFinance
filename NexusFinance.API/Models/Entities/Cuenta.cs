using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("TipoCuenta", "EstaActivo", Name = "IX_Cuentas_TipoCuenta")]
[Index("UsuarioId", "EstaActivo", Name = "IX_Cuentas_UsuarioId_Activo")]
public partial class Cuenta
{
    [Key]
    public Guid CuentaId { get; set; }

    public Guid UsuarioId { get; set; }

    [StringLength(100)]
    public string NombreCuenta { get; set; } = null!;

    [StringLength(50)]
    public string TipoCuenta { get; set; } = null!;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal? Saldo { get; set; }

    [StringLength(3)]
    public string? Moneda { get; set; }

    [StringLength(100)]
    public string? NombreBanco { get; set; }

    [StringLength(50)]
    public string? NumeroCuenta { get; set; }

    public bool? EstaActivo { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [InverseProperty("Cuenta")]
    public virtual ICollection<MetasFinanciera> MetasFinancieras { get; set; } = new List<MetasFinanciera>();

    [InverseProperty("Cuenta")]
    public virtual ICollection<Transaccione> Transacciones { get; set; } = new List<Transaccione>();

    [InverseProperty("Cuenta")]
    public virtual ICollection<TransaccionesRecurrente> TransaccionesRecurrentes { get; set; } = new List<TransaccionesRecurrente>();

    [InverseProperty("CuentaDestino")]
    public virtual ICollection<Transferencia> TransferenciaCuentaDestinos { get; set; } = new List<Transferencia>();

    [InverseProperty("CuentaOrigen")]
    public virtual ICollection<Transferencia> TransferenciaCuentaOrigens { get; set; } = new List<Transferencia>();

    [ForeignKey("UsuarioId")]
    [InverseProperty("Cuenta")]
    public virtual Usuario Usuario { get; set; } = null!;
}
