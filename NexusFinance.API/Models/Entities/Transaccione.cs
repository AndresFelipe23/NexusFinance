using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("CategoriaId", "AñoTransaccion", "MesTransaccion", "TipoTransaccion", Name = "IX_Analisis_Categoria_Mes")]
[Index("UsuarioId", "FechaSoloTransaccion", Name = "IX_Dashboard_Usuario_Fecha")]
[Index("CategoriaId", "FechaTransaccion", Name = "IX_Transacciones_Categoria_Fecha", IsDescending = new[] { false, true })]
[Index("CuentaId", "FechaTransaccion", Name = "IX_Transacciones_Cuenta_Fecha", IsDescending = new[] { false, true })]
[Index("UsuarioId", "AñoTransaccion", "MesTransaccion", Name = "IX_Transacciones_Mes_Usuario")]
[Index("TipoTransaccion", "UsuarioId", "FechaTransaccion", Name = "IX_Transacciones_Tipo_Usuario_Fecha", IsDescending = new[] { false, false, true })]
[Index("UsuarioId", "FechaTransaccion", Name = "IX_Transacciones_Usuario_Fecha", IsDescending = new[] { false, true })]
public partial class Transaccione
{
    [Key]
    public Guid TransaccionId { get; set; }

    public Guid UsuarioId { get; set; }

    public Guid CuentaId { get; set; }

    public Guid CategoriaId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Monto { get; set; }

    [StringLength(20)]
    public string TipoTransaccion { get; set; } = null!;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    [StringLength(1000)]
    public string? Notas { get; set; }

    public DateTime FechaTransaccion { get; set; }

    public Guid? TransaccionRecurrenteId { get; set; }

    [StringLength(500)]
    public string? UrlRecibo { get; set; }

    public bool? EstaConciliado { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    public int? AñoTransaccion { get; set; }

    public int? MesTransaccion { get; set; }

    public DateOnly? FechaSoloTransaccion { get; set; }

    [ForeignKey("CategoriaId")]
    [InverseProperty("Transacciones")]
    public virtual Categoria Categoria { get; set; } = null!;

    [InverseProperty("Transaccion")]
    public virtual ICollection<ContribucionesMeta> ContribucionesMeta { get; set; } = new List<ContribucionesMeta>();

    [ForeignKey("CuentaId")]
    [InverseProperty("Transacciones")]
    public virtual Cuenta Cuenta { get; set; } = null!;

    [InverseProperty("Transaccion")]
    public virtual ICollection<GastosViaje> GastosViajes { get; set; } = new List<GastosViaje>();

    [ForeignKey("TransaccionRecurrenteId")]
    [InverseProperty("Transacciones")]
    public virtual TransaccionesRecurrente? TransaccionRecurrente { get; set; }

    [ForeignKey("UsuarioId")]
    [InverseProperty("Transacciones")]
    public virtual Usuario Usuario { get; set; } = null!;
}
