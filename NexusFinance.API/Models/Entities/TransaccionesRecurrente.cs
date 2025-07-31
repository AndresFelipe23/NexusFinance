using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("Frecuencia", "EstaActivo", Name = "IX_TransaccionesRecurrentes_Frecuencia")]
[Index("UsuarioId", "EstaActivo", Name = "IX_TransaccionesRecurrentes_Usuario_Activo")]
public partial class TransaccionesRecurrente
{
    [Key]
    public Guid RecurrenteId { get; set; }

    public Guid UsuarioId { get; set; }

    public Guid CuentaId { get; set; }

    public Guid CategoriaId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Monto { get; set; }

    [StringLength(20)]
    public string TipoTransaccion { get; set; } = null!;

    [StringLength(500)]
    public string? Descripcion { get; set; }

    [StringLength(20)]
    public string Frecuencia { get; set; } = null!;

    public DateTime FechaInicio { get; set; }

    public DateTime? FechaFin { get; set; }

    public DateTime ProximaFechaEjecucion { get; set; }

    public bool? EstaActivo { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    [ForeignKey("CategoriaId")]
    [InverseProperty("TransaccionesRecurrentes")]
    public virtual Categoria Categoria { get; set; } = null!;

    [ForeignKey("CuentaId")]
    [InverseProperty("TransaccionesRecurrentes")]
    public virtual Cuenta Cuenta { get; set; } = null!;

    [InverseProperty("TransaccionRecurrente")]
    public virtual ICollection<Transaccione> Transacciones { get; set; } = new List<Transaccione>();

    [ForeignKey("UsuarioId")]
    [InverseProperty("TransaccionesRecurrentes")]
    public virtual Usuario Usuario { get; set; } = null!;
}
