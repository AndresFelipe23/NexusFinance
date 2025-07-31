using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System.ComponentModel.DataAnnotations;

namespace NexusFinance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IDashboardService dashboardService, ILogger<DashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Obtiene todos los datos del dashboard para un usuario
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <returns>Dashboard completo con todas las estadísticas</returns>
    [HttpGet("completo/{usuarioId}")]
    public async Task<ActionResult<DashboardCompletoDTO>> ObtenerDashboardCompleto([Required] Guid usuarioId)
    {
        try
        {
            _logger.LogInformation("Solicitando dashboard completo para usuario: {UsuarioId}", usuarioId);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            var dashboard = await _dashboardService.ObtenerDashboardCompletoAsync(usuarioId);
            
            _logger.LogInformation("Dashboard completo obtenido exitosamente para usuario: {UsuarioId}", usuarioId);
            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener dashboard completo para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = "Error interno del servidor al obtener el dashboard" });
        }
    }

    /// <summary>
    /// Obtiene las estadísticas generales del usuario
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <returns>Estadísticas generales</returns>
    [HttpGet("estadisticas/{usuarioId}")]
    public async Task<ActionResult<EstadisticasGeneralesDTO>> ObtenerEstadisticasGenerales([Required] Guid usuarioId)
    {
        try
        {
            _logger.LogInformation("Solicitando estadísticas generales para usuario: {UsuarioId}", usuarioId);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            var estadisticas = await _dashboardService.ObtenerEstadisticasGeneralesAsync(usuarioId);
            
            return Ok(estadisticas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener estadísticas generales para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = "Error interno del servidor al obtener las estadísticas" });
        }
    }

    /// <summary>
    /// Obtiene transacciones agrupadas por categoría
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <param name="tipo">Tipo de transacción: 'ingreso', 'gasto' o null para ambos</param>
    /// <returns>Lista de transacciones por categoría</returns>
    [HttpGet("categorias/{usuarioId}")]
    public async Task<ActionResult<List<TransaccionPorCategoriaDTO>>> ObtenerTransaccionesPorCategoria(
        [Required] Guid usuarioId, 
        [FromQuery] string? tipo = null)
    {
        try
        {
            _logger.LogInformation("Solicitando transacciones por categoría para usuario: {UsuarioId}, tipo: {Tipo}", usuarioId, tipo);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            // Validar tipo si se proporciona
            if (!string.IsNullOrWhiteSpace(tipo) && tipo != "ingreso" && tipo != "gasto")
            {
                return BadRequest("El tipo debe ser 'ingreso' o 'gasto'");
            }

            var transacciones = await _dashboardService.ObtenerTransaccionesPorCategoriaAsync(usuarioId, tipo);
            
            return Ok(transacciones);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener transacciones por categoría para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = "Error interno del servidor al obtener las transacciones por categoría" });
        }
    }

    /// <summary>
    /// Obtiene las tendencias mensuales de ingresos y gastos
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <returns>Lista de tendencias mensuales</returns>
    [HttpGet("tendencias/{usuarioId}")]
    public async Task<ActionResult<List<TendenciaMensualDTO>>> ObtenerTendenciasMensuales([Required] Guid usuarioId)
    {
        try
        {
            _logger.LogInformation("Solicitando tendencias mensuales para usuario: {UsuarioId}", usuarioId);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            var tendencias = await _dashboardService.ObtenerTendenciasMensualesAsync(usuarioId);
            
            return Ok(tendencias);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener tendencias mensuales para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = "Error interno del servidor al obtener las tendencias mensuales" });
        }
    }

    /// <summary>
    /// Obtiene resumen de las metas financieras del usuario
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <param name="limite">Número máximo de metas a retornar (default: 5)</param>
    /// <returns>Lista de metas con resumen</returns>
    [HttpGet("metas/{usuarioId}")]
    public async Task<ActionResult<List<MetaResumenDTO>>> ObtenerResumenMetas(
        [Required] Guid usuarioId, 
        [FromQuery] int limite = 5)
    {
        try
        {
            _logger.LogInformation("Solicitando resumen de metas para usuario: {UsuarioId}, límite: {Limite}", usuarioId, limite);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            if (limite <= 0 || limite > 50)
            {
                return BadRequest("El límite debe estar entre 1 y 50");
            }

            var metas = await _dashboardService.ObtenerResumenMetasAsync(usuarioId, limite);
            
            return Ok(metas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener resumen de metas para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = "Error interno del servidor al obtener el resumen de metas" });
        }
    }

    /// <summary>
    /// Obtiene resumen de las cuentas del usuario
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <param name="limite">Número máximo de cuentas a retornar (default: 6)</param>
    /// <returns>Lista de cuentas con resumen</returns>
    [HttpGet("cuentas/{usuarioId}")]
    public async Task<ActionResult<List<CuentaResumenDTO>>> ObtenerResumenCuentas(
        [Required] Guid usuarioId, 
        [FromQuery] int limite = 6)
    {
        try
        {
            _logger.LogInformation("Solicitando resumen de cuentas para usuario: {UsuarioId}, límite: {Limite}", usuarioId, limite);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            if (limite <= 0 || limite > 50)
            {
                return BadRequest("El límite debe estar entre 1 y 50");
            }

            var cuentas = await _dashboardService.ObtenerResumenCuentasAsync(usuarioId, limite);
            
            return Ok(cuentas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener resumen de cuentas para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = "Error interno del servidor al obtener el resumen de cuentas" });
        }
    }

    /// <summary>
    /// Obtiene las transacciones más recientes del usuario
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <param name="limite">Número máximo de transacciones a retornar (default: 10)</param>
    /// <returns>Lista de transacciones recientes</returns>
    [HttpGet("transacciones-recientes/{usuarioId}")]
    public async Task<ActionResult<List<TransaccionRecienteDTO>>> ObtenerTransaccionesRecientes(
        [Required] Guid usuarioId, 
        [FromQuery] int limite = 10)
    {
        try
        {
            _logger.LogInformation("Solicitando transacciones recientes para usuario: {UsuarioId}, límite: {Limite}", usuarioId, limite);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            if (limite <= 0 || limite > 100)
            {
                return BadRequest("El límite debe estar entre 1 y 100");
            }

            var transacciones = await _dashboardService.ObtenerTransaccionesRecientesAsync(usuarioId, limite);
            
            return Ok(transacciones);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener transacciones recientes para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = "Error interno del servidor al obtener las transacciones recientes" });
        }
    }

    /// <summary>
    /// Endpoint de salud para verificar que el servicio de dashboard está funcionando
    /// </summary>
    /// <returns>Estado del servicio</returns>
    [HttpGet("health")]
    public ActionResult<object> Health()
    {
        return Ok(new 
        { 
            status = "healthy", 
            timestamp = DateTime.UtcNow,
            service = "Dashboard API"
        });
    }

    /// <summary>
    /// Endpoint simplificado para testing - solo estadísticas básicas
    /// </summary>
    /// <param name="usuarioId">ID del usuario</param>
    /// <returns>Solo estadísticas generales</returns>
    [HttpGet("test/{usuarioId}")]
    public async Task<ActionResult<EstadisticasGeneralesDTO>> TestDashboard([Required] Guid usuarioId)
    {
        try
        {
            _logger.LogInformation("Testing dashboard básico para usuario: {UsuarioId}", usuarioId);

            if (usuarioId == Guid.Empty)
            {
                return BadRequest("El ID del usuario es requerido y debe ser válido");
            }

            var estadisticas = await _dashboardService.ObtenerEstadisticasGeneralesAsync(usuarioId);
            
            return Ok(estadisticas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en test de dashboard para usuario: {UsuarioId}", usuarioId);
            return StatusCode(500, new { error = ex.Message, details = ex.InnerException?.Message });
        }
    }
}