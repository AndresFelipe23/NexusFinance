using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace NexusFinance.API.Models.Entities;

public partial class NexusFinanceContext : DbContext
{
    public NexusFinanceContext()
    {
    }

    public NexusFinanceContext(DbContextOptions<NexusFinanceContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ActividadesViaje> ActividadesViajes { get; set; }

    public virtual DbSet<Categoria> Categorias { get; set; }

    public virtual DbSet<CategoriasGastosViaje> CategoriasGastosViajes { get; set; }

    public virtual DbSet<CategoriasPresupuesto> CategoriasPresupuestos { get; set; }

    public virtual DbSet<ChecklistViaje> ChecklistViajes { get; set; }

    public virtual DbSet<ContribucionesMeta> ContribucionesMetas { get; set; }

    public virtual DbSet<Cuenta> Cuentas { get; set; }

    public virtual DbSet<DocumentosViaje> DocumentosViajes { get; set; }

    public virtual DbSet<GastosViaje> GastosViajes { get; set; }

    public virtual DbSet<MetasFinanciera> MetasFinancieras { get; set; }

    public virtual DbSet<PlanesVacacione> PlanesVacaciones { get; set; }

    public virtual DbSet<Presupuesto> Presupuestos { get; set; }

    public virtual DbSet<PresupuestoViaje> PresupuestoViajes { get; set; }

    public virtual DbSet<Transaccione> Transacciones { get; set; }

    public virtual DbSet<TransaccionesRecurrente> TransaccionesRecurrentes { get; set; }

    public virtual DbSet<Transferencia> Transferencias { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=mssql-188335-0.cloudclusters.net,13026;Initial Catalog=NexusFinance;Persist Security Info=False;User ID=andres;Password=Soypipe23@;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=True;Connection Timeout=30;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ActividadesViaje>(entity =>
        {
            entity.HasKey(e => e.ActividadId).HasName("PK__Activida__981483909B90E646");

            entity.Property(e => e.ActividadId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CostoEstimado).HasDefaultValue(0m);
            entity.Property(e => e.CostoReal).HasDefaultValue(0m);
            entity.Property(e => e.EstadoActividad).HasDefaultValue("planificada");
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Prioridad).HasDefaultValue("media");

            entity.HasOne(d => d.CategoriaViaje).WithMany(p => p.ActividadesViajes).HasConstraintName("FK__Actividad__Categ__3E1D39E1");

            entity.HasOne(d => d.Plan).WithMany(p => p.ActividadesViajes).HasConstraintName("FK__Actividad__PlanI__3D2915A8");
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.HasKey(e => e.CategoriaId).HasName("PK__Categori__F353C1E591E3CE31");

            entity.HasIndex(e => e.CategoriaIdPadre, "IX_Categorias_Padre").HasFilter("([CategoriaIdPadre] IS NOT NULL)");

            entity.HasIndex(e => new { e.UsuarioId, e.NombreCategoria, e.TipoCategoria }, "IX_Categorias_Usuario_Nombre_Tipo")
                .IsUnique()
                .HasFilter("([EstaActivo]=(1))");

            entity.Property(e => e.CategoriaId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Color).HasDefaultValue("#3B82F6");
            entity.Property(e => e.EstaActivo).HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Icono).HasDefaultValue("categoria");

            entity.HasOne(d => d.CategoriaIdPadreNavigation).WithMany(p => p.InverseCategoriaIdPadreNavigation).HasConstraintName("FK__Categoria__Categ__60A75C0F");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Categoria).HasConstraintName("FK__Categoria__Usuar__5FB337D6");
        });

        modelBuilder.Entity<CategoriasGastosViaje>(entity =>
        {
            entity.HasKey(e => e.CategoriaViajeId).HasName("PK__Categori__B1501EC02DB1C09C");

            entity.Property(e => e.CategoriaViajeId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Color).HasDefaultValue("#3B82F6");
            entity.Property(e => e.EsObligatoria).HasDefaultValue(false);
            entity.Property(e => e.EstaActivo).HasDefaultValue(true);
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Icono).HasDefaultValue("travel");
            entity.Property(e => e.OrdenVisualizacion).HasDefaultValue(0);
        });

        modelBuilder.Entity<CategoriasPresupuesto>(entity =>
        {
            entity.HasKey(e => e.CategoriaPresupuestoId).HasName("PK__Categori__749F72F3A0C893E7");

            entity.Property(e => e.CategoriaPresupuestoId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.MontoGastado).HasDefaultValue(0m);

            entity.HasOne(d => d.Categoria).WithMany(p => p.CategoriasPresupuestos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Categoria__Categ__114A936A");

            entity.HasOne(d => d.Presupuesto).WithMany(p => p.CategoriasPresupuestos).HasConstraintName("FK__Categoria__Presu__10566F31");
        });

        modelBuilder.Entity<ChecklistViaje>(entity =>
        {
            entity.HasKey(e => e.ChecklistId).HasName("PK__Checklis__4C1D499A72939C88");

            entity.HasIndex(e => new { e.FechaLimite, e.EstaCompletado }, "IX_ChecklistViaje_FechaLimite").HasFilter("([FechaLimite] IS NOT NULL AND [EstaCompletado]=(0))");

            entity.Property(e => e.ChecklistId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CategoriaChecklist).HasDefaultValue("general");
            entity.Property(e => e.EstaCompletado).HasDefaultValue(false);
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.OrdenVisualizacion).HasDefaultValue(0);
            entity.Property(e => e.Prioridad).HasDefaultValue("media");

            entity.HasOne(d => d.Plan).WithMany(p => p.ChecklistViajes).HasConstraintName("FK__Checklist__PlanI__46B27FE2");
        });

        modelBuilder.Entity<ContribucionesMeta>(entity =>
        {
            entity.HasKey(e => e.ContribucionId).HasName("PK__Contribu__89FEA70E9EEA3185");

            entity.Property(e => e.ContribucionId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Meta).WithMany(p => p.ContribucionesMeta).HasConstraintName("FK__Contribuc__MetaI__160F4887");

            entity.HasOne(d => d.Transaccion).WithMany(p => p.ContribucionesMeta).HasConstraintName("FK__Contribuc__Trans__17036CC0");
        });

        modelBuilder.Entity<Cuenta>(entity =>
        {
            entity.HasKey(e => e.CuentaId).HasName("PK__Cuentas__40072E81DE14A38E");

            entity.HasIndex(e => new { e.UsuarioId, e.NombreCuenta }, "IX_Cuentas_Usuario_Nombre")
                .IsUnique()
                .HasFilter("([EstaActivo]=(1))");

            entity.Property(e => e.CuentaId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EstaActivo).HasDefaultValue(true);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Moneda).HasDefaultValue("USD");
            entity.Property(e => e.Saldo).HasDefaultValue(0m);

            entity.HasOne(d => d.Usuario).WithMany(p => p.Cuenta).HasConstraintName("FK__Cuentas__Usuario__5812160E");
        });

        modelBuilder.Entity<DocumentosViaje>(entity =>
        {
            entity.HasKey(e => e.DocumentoId).HasName("PK__Document__5DDBFC768C7D00CF");

            entity.HasIndex(e => new { e.FechaVencimiento, e.EstaVerificado }, "IX_DocumentosViaje_Vencimiento").HasFilter("([FechaVencimiento] IS NOT NULL)");

            entity.Property(e => e.DocumentoId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EsObligatorio).HasDefaultValue(false);
            entity.Property(e => e.EstaVerificado).HasDefaultValue(false);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Plan).WithMany(p => p.DocumentosViajes).HasConstraintName("FK__Documento__PlanI__56E8E7AB");
        });

        modelBuilder.Entity<GastosViaje>(entity =>
        {
            entity.HasKey(e => e.GastoViajeId).HasName("PK__GastosVi__82901F7D311C2B9A");

            entity.HasIndex(e => e.ActividadId, "IX_GastosViaje_Actividad").HasFilter("([ActividadId] IS NOT NULL)");

            entity.HasIndex(e => e.TransaccionId, "IX_GastosViaje_Transaccion").HasFilter("([TransaccionId] IS NOT NULL)");

            entity.Property(e => e.GastoViajeId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.NumeroPersonas).HasDefaultValue(1);

            entity.HasOne(d => d.Actividad).WithMany(p => p.GastosViajes).HasConstraintName("FK__GastosVia__Activ__4F47C5E3");

            entity.HasOne(d => d.CategoriaViaje).WithMany(p => p.GastosViajes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__GastosVia__Categ__4E53A1AA");

            entity.HasOne(d => d.Plan).WithMany(p => p.GastosViajes).HasConstraintName("FK__GastosVia__PlanI__4C6B5938");

            entity.HasOne(d => d.Transaccion).WithMany(p => p.GastosViajes).HasConstraintName("FK__GastosVia__Trans__4D5F7D71");
        });

        modelBuilder.Entity<MetasFinanciera>(entity =>
        {
            entity.HasKey(e => e.MetaId).HasName("PK__MetasFin__60EE54184ABE3868");

            entity.HasIndex(e => new { e.FechaObjetivo, e.EstaCompletada }, "IX_MetasFinancieras_Fecha_Objetivo").HasFilter("([FechaObjetivo] IS NOT NULL AND [EstaCompletada]=(0))");

            entity.Property(e => e.MetaId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EstaCompletada).HasDefaultValue(false);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.MontoActual).HasDefaultValue(0m);

            entity.HasOne(d => d.Cuenta).WithMany(p => p.MetasFinancieras).HasConstraintName("FK__MetasFina__Cuent__693CA210");

            entity.HasOne(d => d.Usuario).WithMany(p => p.MetasFinancieras).HasConstraintName("FK__MetasFina__Usuar__68487DD7");
        });

        modelBuilder.Entity<PlanesVacacione>(entity =>
        {
            entity.HasKey(e => e.PlanId).HasName("PK__PlanesVa__755C22B791A3249C");

            entity.HasIndex(e => e.MetaFinancieraId, "IX_PlanesVacaciones_Meta").HasFilter("([MetaFinancieraId] IS NOT NULL)");

            entity.Property(e => e.PlanId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CantidadPersonas).HasDefaultValue(1);
            entity.Property(e => e.EsViajeInternacional).HasDefaultValue(false);
            entity.Property(e => e.EstadoPlan).HasDefaultValue("planificando");
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.PresupuestoReal).HasDefaultValue(0m);

            entity.HasOne(d => d.MetaFinanciera).WithMany(p => p.PlanesVacaciones).HasConstraintName("FK__PlanesVac__MetaF__2180FB33");

            entity.HasOne(d => d.Usuario).WithMany(p => p.PlanesVacaciones).HasConstraintName("FK__PlanesVac__Usuar__208CD6FA");
        });

        modelBuilder.Entity<Presupuesto>(entity =>
        {
            entity.HasKey(e => e.PresupuestoId).HasName("PK__Presupue__E2E362FF27102289");

            entity.HasIndex(e => new { e.PeriodoPresupuesto, e.FechaInicio, e.FechaFin }, "IX_Presupuestos_Periodo_Fechas").HasFilter("([EstaActivo]=(1))");

            entity.HasIndex(e => new { e.UsuarioId, e.PeriodoPresupuesto, e.FechaInicio }, "IX_Presupuestos_Usuario_Periodo_Activo")
                .IsUnique()
                .HasFilter("([EstaActivo]=(1))");

            entity.Property(e => e.PresupuestoId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EstaActivo).HasDefaultValue(true);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Presupuestos).HasConstraintName("FK__Presupues__Usuar__09A971A2");
        });

        modelBuilder.Entity<PresupuestoViaje>(entity =>
        {
            entity.HasKey(e => e.PresupuestoViajeId).HasName("PK__Presupue__36D06DCA8DFB187F");

            entity.Property(e => e.PresupuestoViajeId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.GastoReal).HasDefaultValue(0m);

            entity.HasOne(d => d.CategoriaViaje).WithMany(p => p.PresupuestoViajes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Presupues__Categ__339FAB6E");

            entity.HasOne(d => d.Plan).WithMany(p => p.PresupuestoViajes).HasConstraintName("FK__Presupues__PlanI__32AB8735");
        });

        modelBuilder.Entity<Transaccione>(entity =>
        {
            entity.HasKey(e => e.TransaccionId).HasName("PK__Transacc__86A849FE1C17BCB1");

            entity.HasIndex(e => new { e.UsuarioId, e.TipoTransaccion, e.AñoTransaccion, e.MesTransaccion, e.CategoriaId }, "IX_Presupuesto_Analisis").HasFilter("([TipoTransaccion]='gasto')");

            entity.HasIndex(e => e.TransaccionRecurrenteId, "IX_Transacciones_Recurrente").HasFilter("([TransaccionRecurrenteId] IS NOT NULL)");

            entity.Property(e => e.TransaccionId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.AñoTransaccion).HasComputedColumnSql("(datepart(year,[FechaTransaccion]))", true);
            entity.Property(e => e.EstaConciliado).HasDefaultValue(false);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaSoloTransaccion).HasComputedColumnSql("(CONVERT([date],[FechaTransaccion]))", true);
            entity.Property(e => e.MesTransaccion).HasComputedColumnSql("(datepart(month,[FechaTransaccion]))", true);

            entity.HasOne(d => d.Categoria).WithMany(p => p.Transacciones)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Transacci__Categ__7A672E12");

            entity.HasOne(d => d.Cuenta).WithMany(p => p.Transacciones)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Transacci__Cuent__797309D9");

            entity.HasOne(d => d.TransaccionRecurrente).WithMany(p => p.Transacciones).HasConstraintName("FK__Transacci__Trans__7B5B524B");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Transacciones).HasConstraintName("FK__Transacci__Usuar__787EE5A0");
        });

        modelBuilder.Entity<TransaccionesRecurrente>(entity =>
        {
            entity.HasKey(e => e.RecurrenteId).HasName("PK__Transacc__B340612F0051EF2B");

            entity.HasIndex(e => new { e.ProximaFechaEjecucion, e.EstaActivo }, "IX_TransaccionesRecurrentes_ProximaEjecucion").HasFilter("([EstaActivo]=(1))");

            entity.Property(e => e.RecurrenteId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EstaActivo).HasDefaultValue(true);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.Categoria).WithMany(p => p.TransaccionesRecurrentes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Transacci__Categ__71D1E811");

            entity.HasOne(d => d.Cuenta).WithMany(p => p.TransaccionesRecurrentes)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Transacci__Cuent__70DDC3D8");

            entity.HasOne(d => d.Usuario).WithMany(p => p.TransaccionesRecurrentes).HasConstraintName("FK__Transacci__Usuar__6FE99F9F");
        });

        modelBuilder.Entity<Transferencia>(entity =>
        {
            entity.HasKey(e => e.TransferenciaId).HasName("PK__Transfer__E5B4F5D247AAEAD8");

            entity.Property(e => e.TransferenciaId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.ComisionTransferencia).HasDefaultValue(0m);
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");

            entity.HasOne(d => d.CuentaDestino).WithMany(p => p.TransferenciaCuentaDestinos)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Transfere__Cuent__02FC7413");

            entity.HasOne(d => d.CuentaOrigen).WithMany(p => p.TransferenciaCuentaOrigens)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Transfere__Cuent__02084FDA");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Transferencia).HasConstraintName("FK__Transfere__Usuar__01142BA1");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.UsuarioId).HasName("PK__Usuarios__2B3DE7B8A6E07527");

            entity.HasIndex(e => e.EstaActivo, "IX_Usuarios_EstaActivo").HasFilter("([EstaActivo]=(1))");

            entity.Property(e => e.UsuarioId).HasDefaultValueSql("(newid())");
            entity.Property(e => e.EstaActivo).HasDefaultValue(true);
            entity.Property(e => e.FechaActualizacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.FechaCreacion).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Moneda).HasDefaultValue("USD");
            entity.Property(e => e.ZonaHoraria).HasDefaultValue("UTC");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
