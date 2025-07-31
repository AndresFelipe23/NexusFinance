using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

[Index("Email", Name = "UQ__Usuarios__A9D10534DF5458DE", IsUnique = true)]
public partial class Usuario
{
    [Key]
    public Guid UsuarioId { get; set; }

    [StringLength(255)]
    public string Email { get; set; } = null!;

    [StringLength(255)]
    public string ClaveHash { get; set; } = null!;

    [StringLength(100)]
    public string Nombre { get; set; } = null!;

    [StringLength(100)]
    public string Apellido { get; set; } = null!;

    [StringLength(3)]
    public string? Moneda { get; set; }

    [StringLength(50)]
    public string? ZonaHoraria { get; set; }

    public DateTime? FechaCreacion { get; set; }

    public DateTime? FechaActualizacion { get; set; }

    public bool? EstaActivo { get; set; }

    [InverseProperty("Usuario")]
    public virtual ICollection<Categoria> Categoria { get; set; } = new List<Categoria>();

    [InverseProperty("Usuario")]
    public virtual ICollection<Cuenta> Cuenta { get; set; } = new List<Cuenta>();

    [InverseProperty("Usuario")]
    public virtual ICollection<MetasFinanciera> MetasFinancieras { get; set; } = new List<MetasFinanciera>();

    [InverseProperty("Usuario")]
    public virtual ICollection<PlanesVacacione> PlanesVacaciones { get; set; } = new List<PlanesVacacione>();

    [InverseProperty("Usuario")]
    public virtual ICollection<Presupuesto> Presupuestos { get; set; } = new List<Presupuesto>();

    [InverseProperty("Usuario")]
    public virtual ICollection<Transaccione> Transacciones { get; set; } = new List<Transaccione>();

    [InverseProperty("Usuario")]
    public virtual ICollection<TransaccionesRecurrente> TransaccionesRecurrentes { get; set; } = new List<TransaccionesRecurrente>();

    [InverseProperty("Usuario")]
    public virtual ICollection<Transferencia> Transferencia { get; set; } = new List<Transferencia>();
}
