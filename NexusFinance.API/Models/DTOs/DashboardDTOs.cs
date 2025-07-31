using System.ComponentModel.DataAnnotations;

namespace NexusFinance.API.Models.DTOs;

/// <summary>
/// DTO para las estadísticas generales del dashboard
/// </summary>
public class EstadisticasGeneralesDTO
{
    public decimal TotalIngresos { get; set; }
    public decimal TotalGastos { get; set; }
    public decimal Balance { get; set; }
    public int TransaccionesCount { get; set; }
    public int CuentasCount { get; set; }
    public int MetasCount { get; set; }
    public int MetasCompletadas { get; set; }
    public int PresupuestosCount { get; set; }
}

/// <summary>
/// DTO para transacciones agrupadas por categoría
/// </summary>
public class TransaccionPorCategoriaDTO
{
    public Guid CategoriaId { get; set; }
    public string NombreCategoria { get; set; } = string.Empty;
    public string TipoCategoria { get; set; } = string.Empty;
    public string IconoCategoria { get; set; } = "📊";
    public string Color { get; set; } = "#6B7280";
    public decimal MontoTotal { get; set; }
    public int TransaccionesCount { get; set; }
}

/// <summary>
/// DTO para tendencias mensuales
/// </summary>
public class TendenciaMensualDTO
{
    public string MesNombre { get; set; } = string.Empty;
    public int Anio { get; set; }
    public int Mes { get; set; }
    public decimal Ingresos { get; set; }
    public decimal Gastos { get; set; }
    public decimal Balance { get; set; }
}

/// <summary>
/// DTO para resumen de metas financieras
/// </summary>
public class MetaResumenDTO
{
    public Guid MetaId { get; set; }
    public string NombreMeta { get; set; } = string.Empty;
    public decimal MontoObjetivo { get; set; }
    public decimal MontoActual { get; set; }
    public decimal PorcentajeProgreso { get; set; }
    public int? DiasRestantes { get; set; }
    public bool EstaCompletada { get; set; }
    public DateTime? FechaObjetivo { get; set; }
}

/// <summary>
/// DTO para resumen de cuentas
/// </summary>
public class CuentaResumenDTO
{
    public Guid CuentaId { get; set; }
    public string NombreCuenta { get; set; } = string.Empty;
    public string TipoCuenta { get; set; } = string.Empty;
    public decimal Saldo { get; set; }
    public string? NombreBanco { get; set; }
    public string Moneda { get; set; } = "COP";
}

/// <summary>
/// DTO para transacciones recientes
/// </summary>
public class TransaccionRecienteDTO
{
    public Guid TransaccionId { get; set; }
    public decimal Monto { get; set; }
    public string TipoTransaccion { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public DateTime FechaTransaccion { get; set; }
    public string NombreCategoria { get; set; } = string.Empty;
    public string TipoCategoria { get; set; } = string.Empty;
    public string IconoCategoria { get; set; } = "📊";
    public string Color { get; set; } = "#6B7280";
    public string NombreCuenta { get; set; } = string.Empty;
    public string TipoCuenta { get; set; } = string.Empty;
    public string? NombreBanco { get; set; }
}

/// <summary>
/// DTO principal que contiene todos los datos del dashboard
/// </summary>
public class DashboardCompletoDTO
{
    public EstadisticasGeneralesDTO Estadisticas { get; set; } = new();
    public List<TransaccionPorCategoriaDTO> GastosPorCategoria { get; set; } = new();
    public List<TransaccionPorCategoriaDTO> IngresosPorCategoria { get; set; } = new();
    public List<TendenciaMensualDTO> TendenciasMensuales { get; set; } = new();
    public List<MetaResumenDTO> MetasResumen { get; set; } = new();
    public List<CuentaResumenDTO> CuentasResumen { get; set; } = new();
    public List<TransaccionRecienteDTO> TransaccionesRecientes { get; set; } = new();
}

/// <summary>
/// DTO para solicitar datos del dashboard con parámetros opcionales
/// </summary>
public class DashboardRequestDTO
{
    [Required]
    public Guid UsuarioId { get; set; }
    
    public int? LimiteMetas { get; set; } = 5;
    public int? LimiteCuentas { get; set; } = 6;
    public int? LimiteTransacciones { get; set; } = 10;
    public bool IncluirTendencias { get; set; } = true;
    public bool IncluirCategorias { get; set; } = true;
}