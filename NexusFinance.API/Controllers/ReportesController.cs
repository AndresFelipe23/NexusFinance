using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System.Security.Claims;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportesController : ControllerBase
    {
        private readonly IReportesService _reportesService;
        private readonly ILogger<ReportesController> _logger;

        public ReportesController(IReportesService reportesService, ILogger<ReportesController> logger)
        {
            _reportesService = reportesService;
            _logger = logger;
        }

        private Guid GetUsuarioId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Usuario no autenticado o ID inválido");
            }
            return userId;
        }

        /// <summary>
        /// Obtiene el dashboard financiero con KPIs principales
        /// </summary>
        /// <param name="fechaInicio">Fecha de inicio del período (opcional)</param>
        /// <param name="fechaFin">Fecha de fin del período (opcional)</param>
        /// <returns>Dashboard financiero con KPIs, top categorías y evolución de balance</returns>
        [HttpGet("dashboard-financiero")]
        public async Task<ActionResult<DashboardFinancieroResponseDTO>> ObtenerDashboardFinanciero(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                _logger.LogInformation("Obteniendo dashboard financiero para usuario: {UsuarioId}", usuarioId);

                var resultado = await _reportesService.ObtenerDashboardFinancieroAsync(usuarioId, fechaInicio, fechaFin);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Acceso no autorizado: {Message}", ex.Message);
                return Unauthorized(new ReporteErrorResponseDTO
                {
                    Error = "Acceso no autorizado",
                    Codigo = "UNAUTHORIZED"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener dashboard financiero");
                return StatusCode(500, new ReporteErrorResponseDTO
                {
                    Error = "Error interno del servidor al obtener dashboard financiero",
                    Codigo = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Obtiene el reporte de gastos por categoría
        /// </summary>
        /// <param name="fechaInicio">Fecha de inicio del período (opcional)</param>
        /// <param name="fechaFin">Fecha de fin del período (opcional)</param>
        /// <param name="categoriaId">ID de categoría específica (opcional)</param>
        /// <returns>Reporte de gastos por categoría con detalle y evolución</returns>
        [HttpGet("gastos-por-categoria")]
        public async Task<ActionResult<GastosPorCategoriaResponseDTO>> ObtenerGastosPorCategoria(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null,
            [FromQuery] Guid? categoriaId = null)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                _logger.LogInformation("Obteniendo gastos por categoría para usuario: {UsuarioId}", usuarioId);

                var resultado = await _reportesService.ObtenerGastosPorCategoriaAsync(usuarioId, fechaInicio, fechaFin, categoriaId);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Acceso no autorizado: {Message}", ex.Message);
                return Unauthorized(new ReporteErrorResponseDTO
                {
                    Error = "Acceso no autorizado",
                    Codigo = "UNAUTHORIZED"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener gastos por categoría");
                return StatusCode(500, new ReporteErrorResponseDTO
                {
                    Error = "Error interno del servidor al obtener gastos por categoría",
                    Codigo = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Obtiene el reporte de progreso de metas financieras
        /// </summary>
        /// <param name="estadoMeta">Estado de las metas a filtrar: 'activa', 'completada', 'pausada' (opcional)</param>
        /// <returns>Reporte de progreso de metas con estadísticas y contribuciones</returns>
        [HttpGet("progreso-metas")]
        public async Task<ActionResult<ProgresoMetasResponseDTO>> ObtenerProgresoMetas(
            [FromQuery] string? estadoMeta = null)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                _logger.LogInformation("Obteniendo progreso de metas para usuario: {UsuarioId}", usuarioId);

                // Validar estado de meta si se proporciona
                if (!string.IsNullOrEmpty(estadoMeta) && 
                    !new[] { "activa", "completada", "pausada" }.Contains(estadoMeta.ToLower()))
                {
                    return BadRequest(new ReporteErrorResponseDTO
                    {
                        Error = "Estado de meta inválido. Valores permitidos: activa, completada, pausada",
                        Codigo = "INVALID_ESTADO_META"
                    });
                }

                var resultado = await _reportesService.ObtenerProgresoMetasAsync(usuarioId, estadoMeta?.ToLower());
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Acceso no autorizado: {Message}", ex.Message);
                return Unauthorized(new ReporteErrorResponseDTO
                {
                    Error = "Acceso no autorizado",
                    Codigo = "UNAUTHORIZED"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener progreso de metas");
                return StatusCode(500, new ReporteErrorResponseDTO
                {
                    Error = "Error interno del servidor al obtener progreso de metas",
                    Codigo = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Obtiene el reporte de balance de cuentas
        /// </summary>
        /// <param name="fechaInicio">Fecha de inicio del período (opcional)</param>
        /// <param name="fechaFin">Fecha de fin del período (opcional)</param>
        /// <returns>Reporte de balance y movimientos por cuenta</returns>
        [HttpGet("balance-cuentas")]
        public async Task<ActionResult<BalanceCuentasResponseDTO>> ObtenerBalanceCuentas(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                _logger.LogInformation("Obteniendo balance de cuentas para usuario: {UsuarioId}", usuarioId);

                // Validar rango de fechas
                if (fechaInicio.HasValue && fechaFin.HasValue && fechaInicio.Value > fechaFin.Value)
                {
                    return BadRequest(new ReporteErrorResponseDTO
                    {
                        Error = "La fecha de inicio no puede ser mayor que la fecha de fin",
                        Codigo = "INVALID_DATE_RANGE"
                    });
                }

                var resultado = await _reportesService.ObtenerBalanceCuentasAsync(usuarioId, fechaInicio, fechaFin);
                return Ok(resultado);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Acceso no autorizado: {Message}", ex.Message);
                return Unauthorized(new ReporteErrorResponseDTO
                {
                    Error = "Acceso no autorizado",
                    Codigo = "UNAUTHORIZED"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener balance de cuentas");
                return StatusCode(500, new ReporteErrorResponseDTO
                {
                    Error = "Error interno del servidor al obtener balance de cuentas",
                    Codigo = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Obtiene un resumen ejecutivo con todos los reportes principales
        /// </summary>
        /// <param name="fechaInicio">Fecha de inicio del período (opcional)</param>
        /// <param name="fechaFin">Fecha de fin del período (opcional)</param>
        /// <returns>Resumen ejecutivo con dashboard, top gastos y progreso de metas</returns>
        [HttpGet("resumen-ejecutivo")]
        public async Task<ActionResult<object>> ObtenerResumenEjecutivo(
            [FromQuery] DateTime? fechaInicio = null,
            [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                var usuarioId = GetUsuarioId();
                _logger.LogInformation("Obteniendo resumen ejecutivo para usuario: {UsuarioId}", usuarioId);

                // Ejecutar reportes en paralelo para mejor rendimiento
                var dashboardTask = _reportesService.ObtenerDashboardFinancieroAsync(usuarioId, fechaInicio, fechaFin);
                var gastosTask = _reportesService.ObtenerGastosPorCategoriaAsync(usuarioId, fechaInicio, fechaFin);
                var metasTask = _reportesService.ObtenerProgresoMetasAsync(usuarioId, "activa");
                var cuentasTask = _reportesService.ObtenerBalanceCuentasAsync(usuarioId, fechaInicio, fechaFin);

                await Task.WhenAll(dashboardTask, gastosTask, metasTask, cuentasTask);

                var resumen = new
                {
                    DashboardFinanciero = await dashboardTask,
                    GastosPorCategoria = new
                    {
                        ResumenCategorias = (await gastosTask).ResumenCategorias.Take(5).ToList(), // Solo top 5
                        TotalCategorias = (await gastosTask).ResumenCategorias.Count
                    },
                    ProgresoMetas = new
                    {
                        EstadisticasGenerales = (await metasTask).EstadisticasGenerales,
                        MetasUrgentes = (await metasTask).ResumenMetas
                            .Where(m => m.EstaProximaAVencer || m.EstaVencida)
                            .Take(5)
                            .ToList()
                    },
                    BalanceCuentas = new
                    {
                        TotalPatrimonio = (await cuentasTask).TotalPatrimonio,
                        TotalCuentas = (await cuentasTask).ResumenCuentas.Count,
                        CuentasPrincipales = (await cuentasTask).ResumenCuentas
                            .OrderByDescending(c => c.SaldoActual)
                            .Take(3)
                            .ToList()
                    },
                    Fecha = DateTime.Now
                };

                return Ok(resumen);
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning("Acceso no autorizado: {Message}", ex.Message);
                return Unauthorized(new ReporteErrorResponseDTO
                {
                    Error = "Acceso no autorizado",
                    Codigo = "UNAUTHORIZED"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener resumen ejecutivo");
                return StatusCode(500, new ReporteErrorResponseDTO
                {
                    Error = "Error interno del servidor al obtener resumen ejecutivo",
                    Codigo = "INTERNAL_ERROR"
                });
            }
        }

        /// <summary>
        /// Endpoint de salud para verificar que el servicio de reportes está funcionando
        /// </summary>
        /// <returns>Estado del servicio</returns>
        [HttpGet("health")]
        [AllowAnonymous]
        public ActionResult<object> Health()
        {
            return Ok(new
            {
                Status = "Healthy",
                Service = "ReportesService",
                Timestamp = DateTime.UtcNow,
                Version = "1.0.0"
            });
        }
    }
}