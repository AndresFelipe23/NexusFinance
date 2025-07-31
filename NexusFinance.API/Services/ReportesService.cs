using System.Data;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using NexusFinance.API.Models.DTOs;

namespace NexusFinance.API.Services
{
    public interface IReportesService
    {
        Task<DashboardFinancieroResponseDTO> ObtenerDashboardFinancieroAsync(Guid usuarioId, DateTime? fechaInicio = null, DateTime? fechaFin = null);
        Task<GastosPorCategoriaResponseDTO> ObtenerGastosPorCategoriaAsync(Guid usuarioId, DateTime? fechaInicio = null, DateTime? fechaFin = null, Guid? categoriaId = null);
        Task<ProgresoMetasResponseDTO> ObtenerProgresoMetasAsync(Guid usuarioId, string? estadoMeta = null);
        Task<BalanceCuentasResponseDTO> ObtenerBalanceCuentasAsync(Guid usuarioId, DateTime? fechaInicio = null, DateTime? fechaFin = null);
    }

    public class ReportesService : IReportesService
    {
        private readonly IConfiguration _configuration;
        private readonly string? _connectionString;
        private readonly ILogger<ReportesService> _logger;

        public ReportesService(IConfiguration configuration, ILogger<ReportesService> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _logger = logger;
        }

        public async Task<DashboardFinancieroResponseDTO> ObtenerDashboardFinancieroAsync(Guid usuarioId, DateTime? fechaInicio = null, DateTime? fechaFin = null)
        {
            try
            {
                _logger.LogInformation("Obteniendo dashboard financiero para usuario: {UsuarioId}", usuarioId);

                using var connection = new SqlConnection(_connectionString);
                using var multi = await connection.QueryMultipleAsync(
                    "Reportes_DashboardFinanciero",
                    new { UsuarioId = usuarioId, FechaInicio = fechaInicio, FechaFin = fechaFin },
                    commandType: CommandType.StoredProcedure
                );

                // Leer KPIs principales
                var kpis = await multi.ReadFirstOrDefaultAsync<dynamic>();
                var kpisDTO = new KPIsPrincipalesDTO();
                
                if (kpis != null)
                {
                    kpisDTO.BalanceTotal = kpis.balanceTotal ?? 0;
                    kpisDTO.IngresosPeriodo = kpis.ingresosPeriodo ?? 0;
                    kpisDTO.GastosPeriodo = kpis.gastosPeriodo ?? 0;
                    kpisDTO.BalancePeriodo = kpis.balancePeriodo ?? 0;
                    kpisDTO.MetasActivas = kpis.metasActivas ?? 0;
                    kpisDTO.ProgresoPromedioMetas = kpis.progresoPromedioMetas ?? 0;
                    kpisDTO.PresupuestoTotal = kpis.presupuestoTotal ?? 0;
                    kpisDTO.PresupuestoEjecutado = kpis.presupuestoEjecutado ?? 0;
                    kpisDTO.NumeroTransacciones = kpis.numeroTransacciones ?? 0;
                    kpisDTO.FechaInicio = kpis.fechaInicio ?? DateTime.Now.Date;
                    kpisDTO.FechaFin = kpis.fechaFin ?? DateTime.Now.Date;
                }

                // Leer top categorías
                var topCategorias = (await multi.ReadAsync<dynamic>()).Select(c => new CategoriaGastoDTO
                {
                    Categoria = c.categoria ?? string.Empty,
                    TotalGastado = c.totalGastado ?? 0,
                    NumeroTransacciones = c.numeroTransacciones ?? 0,
                    PromedioTransaccion = c.promedioTransaccion ?? 0
                }).ToList();

                // Leer evolución de balance
                var evolucionBalance = (await multi.ReadAsync<dynamic>()).Select(e => new EvolucionBalanceDTO
                {
                    Anio = e.anio ?? DateTime.Now.Year,
                    Mes = e.mes ?? DateTime.Now.Month,
                    NombreMes = e.nombreMes ?? string.Empty,
                    BalanceMes = e.balanceMes ?? 0,
                    BalanceAcumulado = e.balanceAcumulado ?? 0
                }).ToList();

                var response = new DashboardFinancieroResponseDTO
                {
                    KPIs = kpisDTO,
                    TopCategorias = topCategorias,
                    EvolucionBalance = evolucionBalance
                };

                _logger.LogInformation("Dashboard financiero obtenido exitosamente para usuario: {UsuarioId}", usuarioId);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener dashboard financiero para usuario: {UsuarioId}", usuarioId);
                throw new Exception($"Error al obtener dashboard financiero: {ex.Message}", ex);
            }
        }

        public async Task<GastosPorCategoriaResponseDTO> ObtenerGastosPorCategoriaAsync(Guid usuarioId, DateTime? fechaInicio = null, DateTime? fechaFin = null, Guid? categoriaId = null)
        {
            try
            {
                _logger.LogInformation("Obteniendo gastos por categoría para usuario: {UsuarioId}", usuarioId);

                using var connection = new SqlConnection(_connectionString);
                using var multi = await connection.QueryMultipleAsync(
                    "Reportes_GastosPorCategoria",
                    new { UsuarioId = usuarioId, FechaInicio = fechaInicio, FechaFin = fechaFin, CategoriaId = categoriaId },
                    commandType: CommandType.StoredProcedure
                );

                // Leer resumen por categoría
                var resumenCategorias = (await multi.ReadAsync<dynamic>()).Select(c => new ResumenCategoriaDTO
                {
                    CategoriaId = c.categoriaId,
                    Categoria = c.categoria ?? string.Empty,
                    Color = c.color ?? "#6B7280",
                    TotalGastado = c.totalGastado ?? 0,
                    NumeroTransacciones = c.numeroTransacciones ?? 0,
                    PromedioTransaccion = c.promedioTransaccion ?? 0,
                    MontoMinimo = c.montoMinimo ?? 0,
                    MontoMaximo = c.montoMaximo ?? 0,
                    PorcentajeDelTotal = c.porcentajeDelTotal ?? 0,
                    TotalMesAnterior = c.totalMesAnterior ?? 0
                }).ToList();

                // Leer detalle de transacciones (si se especificó una categoría)
                var detalleTransacciones = new List<DetalleTransaccionDTO>();
                if (categoriaId.HasValue && multi.Read().Any())
                {
                    detalleTransacciones = (await multi.ReadAsync<dynamic>()).Select(t => new DetalleTransaccionDTO
                    {
                        TransaccionId = t.transaccionId,
                        Descripcion = t.descripcion ?? string.Empty,
                        Monto = t.monto ?? 0,
                        Fecha = t.fecha ?? DateTime.Now,
                        Cuenta = t.cuenta ?? string.Empty,
                        Categoria = t.categoria ?? string.Empty
                    }).ToList();
                }

                // Leer evolución diaria
                var evolucionDiaria = (await multi.ReadAsync<dynamic>()).Select(e => new EvolucionDiariaDTO
                {
                    Fecha = e.fecha ?? DateTime.Now.Date,
                    TotalDia = e.totalDia ?? 0,
                    TransaccionesDia = e.transaccionesDia ?? 0
                }).ToList();

                var response = new GastosPorCategoriaResponseDTO
                {
                    ResumenCategorias = resumenCategorias,
                    DetalleTransacciones = detalleTransacciones,
                    EvolucionDiaria = evolucionDiaria
                };

                _logger.LogInformation("Gastos por categoría obtenidos exitosamente para usuario: {UsuarioId}", usuarioId);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener gastos por categoría para usuario: {UsuarioId}", usuarioId);
                throw new Exception($"Error al obtener gastos por categoría: {ex.Message}", ex);
            }
        }

        public async Task<ProgresoMetasResponseDTO> ObtenerProgresoMetasAsync(Guid usuarioId, string? estadoMeta = null)
        {
            try
            {
                _logger.LogInformation("Obteniendo progreso de metas para usuario: {UsuarioId}", usuarioId);

                using var connection = new SqlConnection(_connectionString);
                using var multi = await connection.QueryMultipleAsync(
                    "Reportes_ProgresoMetas",
                    new { UsuarioId = usuarioId, EstadoMeta = estadoMeta },
                    commandType: CommandType.StoredProcedure
                );

                // Leer resumen de metas
                var resumenMetas = (await multi.ReadAsync<dynamic>()).Select(m => new ResumenMetaDTO
                {
                    MetaId = m.metaId,
                    NombreMeta = m.nombreMeta ?? string.Empty,
                    Descripcion = m.descripcion ?? string.Empty,
                    MontoObjetivo = m.montoObjetivo ?? 0,
                    MontoAcumulado = m.montoAcumulado ?? 0,
                    FechaLimite = m.fechaLimite,
                    Estado = m.estado ?? string.Empty,
                    FechaCreacion = m.fechaCreacion ?? DateTime.Now,
                    PorcentajeProgreso = m.porcentajeProgreso ?? 0,
                    MontoFaltante = m.montoFaltante ?? 0,
                    DiasRestantes = m.diasRestantes ?? 0,
                    AhorroRequeridoDiario = m.ahorroRequeridoDiario ?? 0,
                    NumeroContribuciones = m.numeroContribuciones ?? 0,
                    PromedioContribuciones = m.promedioContribuciones ?? 0,
                    UltimaContribucion = m.ultimaContribucion
                }).ToList();

                // Leer contribuciones recientes
                var contribucionesRecientes = (await multi.ReadAsync<dynamic>()).Select(c => new ContribucionRecienteDTO
                {
                    ContribucionId = c.contribucionId,
                    MetaId = c.metaId,
                    NombreMeta = c.nombreMeta ?? string.Empty,
                    Monto = c.monto ?? 0,
                    Fecha = c.fecha ?? DateTime.Now,
                    Descripcion = c.descripcion ?? string.Empty
                }).ToList();

                // Leer estadísticas generales
                var estadisticas = await multi.ReadFirstOrDefaultAsync<dynamic>();
                var estadisticasDTO = new EstadisticasMetasDTO();
                
                if (estadisticas != null)
                {
                    estadisticasDTO.TotalMetas = estadisticas.totalMetas ?? 0;
                    estadisticasDTO.MetasActivas = estadisticas.metasActivas ?? 0;
                    estadisticasDTO.MetasCompletadas = estadisticas.metasCompletadas ?? 0;
                    estadisticasDTO.MetasPausadas = estadisticas.metasPausadas ?? 0;
                    estadisticasDTO.TotalObjetivos = estadisticas.totalObjetivos ?? 0;
                    estadisticasDTO.TotalAcumulado = estadisticas.totalAcumulado ?? 0;
                    estadisticasDTO.TotalFaltante = estadisticas.totalFaltante ?? 0;
                    estadisticasDTO.ProgresoPromedio = estadisticas.progresoPromedio ?? 0;
                    estadisticasDTO.MetasProximasVencer = estadisticas.metasProximasVencer ?? 0;
                }

                var response = new ProgresoMetasResponseDTO
                {
                    ResumenMetas = resumenMetas,
                    ContribucionesRecientes = contribucionesRecientes,
                    EstadisticasGenerales = estadisticasDTO
                };

                _logger.LogInformation("Progreso de metas obtenido exitosamente para usuario: {UsuarioId}", usuarioId);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener progreso de metas para usuario: {UsuarioId}", usuarioId);
                throw new Exception($"Error al obtener progreso de metas: {ex.Message}", ex);
            }
        }

        public async Task<BalanceCuentasResponseDTO> ObtenerBalanceCuentasAsync(Guid usuarioId, DateTime? fechaInicio = null, DateTime? fechaFin = null)
        {
            try
            {
                _logger.LogInformation("Obteniendo balance de cuentas para usuario: {UsuarioId}", usuarioId);

                using var connection = new SqlConnection(_connectionString);
                var resumenCuentas = await connection.QueryAsync<dynamic>(
                    "Reportes_BalanceCuentas",
                    new { UsuarioId = usuarioId, FechaInicio = fechaInicio, FechaFin = fechaFin },
                    commandType: CommandType.StoredProcedure
                );

                var cuentasDTO = resumenCuentas.Select(c => new ResumenCuentaDTO
                {
                    CuentaId = c.cuentaId,
                    NombreCuenta = c.nombreCuenta ?? string.Empty,
                    TipoCuenta = c.tipoCuenta ?? string.Empty,
                    SaldoActual = c.saldoActual ?? 0,
                    MovimientoPeriodo = c.movimientoPeriodo ?? 0,
                    IngresosPeriodo = c.ingresosPeriodo ?? 0,
                    GastosPeriodo = c.gastosPeriodo ?? 0,
                    NumeroTransacciones = c.numeroTransacciones ?? 0,
                    SaldoInicioPeriodo = c.saldoInicioPeriodo ?? 0
                }).ToList();

                var response = new BalanceCuentasResponseDTO
                {
                    ResumenCuentas = cuentasDTO
                };

                _logger.LogInformation("Balance de cuentas obtenido exitosamente para usuario: {UsuarioId}", usuarioId);
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener balance de cuentas para usuario: {UsuarioId}", usuarioId);
                throw new Exception($"Error al obtener balance de cuentas: {ex.Message}", ex);
            }
        }
    }
}