using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System;
using System.Threading.Tasks;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GastosViajeController : ControllerBase
    {
        private readonly GastosViajeService _service;

        public GastosViajeController(GastosViajeService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearGastoViajeDTO dto)
        {
            var result = await _service.CrearGastoAsync(dto.PlanId, dto.CategoriaViajeId, dto.Monto, dto.MonedaGasto, dto.Descripcion, dto.FechaGasto, dto.Ubicacion, dto.NumeroPersonas, dto.ActividadId, dto.TransaccionId, dto.TasaCambioUsada, dto.UrlRecibo, dto.Notas);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarGastoViajeDTO dto)
        {
            if (id != dto.GastoViajeId) return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarGastoAsync(dto.GastoViajeId, dto.CategoriaViajeId, dto.Monto, dto.MonedaGasto, dto.Descripcion, dto.FechaGasto, dto.Ubicacion, dto.NumeroPersonas, dto.ActividadId, dto.TasaCambioUsada, dto.UrlRecibo, dto.Notas, dto.CambiarActividad, dto.RecalcularMontoLocal);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            var result = await _service.EliminarGastoAsync(id);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerGastoPorIdAsync(id);
            return Ok(result);
        }

        [HttpGet("plan/{planId}")]
        public async Task<IActionResult> ObtenerPorPlan(Guid planId, [FromQuery] Guid? categoriaViajeId = null, [FromQuery] Guid? actividadId = null, [FromQuery] DateTime? fechaDesde = null, [FromQuery] DateTime? fechaHasta = null, [FromQuery] decimal? montoMinimo = null, [FromQuery] decimal? montoMaximo = null, [FromQuery] string? monedaGasto = null, [FromQuery] string? ordenarPor = "Fecha", [FromQuery] bool incluirResumen = true)
        {
            try
            {
                // Validar que el planId no sea vacío o por defecto
                if (planId == Guid.Empty)
                {
                    return BadRequest(new { error = "El ID del plan de vacaciones es requerido y debe ser válido." });
                }

                var result = await _service.ObtenerGastosPorPlanAsync(planId, categoriaViajeId, actividadId, fechaDesde, fechaHasta, montoMinimo, montoMaximo, monedaGasto, ordenarPor, incluirResumen);
                return Ok(result);
            }
            catch (Exception ex) when (ex.Message.Contains("El plan de vacaciones no existe"))
            {
                return NotFound(new { error = "El plan de vacaciones especificado no existe.", planId = planId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
            }
        }

        [HttpGet("analisis/categoria/{planId}")]
        public async Task<IActionResult> AnalisisPorCategoria(Guid planId, [FromQuery] bool incluirSinGastos = false)
        {
            var result = await _service.AnalisisPorCategoriaAsync(planId, incluirSinGastos);
            return Ok(result);
        }

        [HttpGet("analisis/temporal/{planId}")]
        public async Task<IActionResult> AnalisisTemporal(Guid planId, [FromQuery] string tipoAnalisis = "Diario")
        {
            var result = await _service.AnalisisTemporalAsync(planId, tipoAnalisis);
            return Ok(result);
        }

        [HttpGet("analisis/actividad/{planId}")]
        public async Task<IActionResult> GastosPorActividad(Guid planId, [FromQuery] bool incluirSinActividad = true)
        {
            var result = await _service.GastosPorActividadAsync(planId, incluirSinActividad);
            return Ok(result);
        }

        [HttpGet("analisis/monedas/{planId}")]
        public async Task<IActionResult> ConversionMonedas(Guid planId)
        {
            var result = await _service.ConversionMonedasAsync(planId);
            return Ok(result);
        }

        [HttpPost("analisis/actualizar-costos-actividades/{planId}")]
        public async Task<IActionResult> ActualizarCostosActividades(Guid planId)
        {
            var result = await _service.ActualizarCostosActividadesAsync(planId);
            return Ok(result);
        }

        /// <summary>
        /// Endpoint de ayuda para verificar si un plan existe - útil para debugging
        /// </summary>
        [HttpGet("plan/{planId}/exists")]
        public async Task<IActionResult> VerificarPlanExiste(Guid planId)
        {
            try
            {
                if (planId == Guid.Empty)
                {
                    return BadRequest(new { error = "ID de plan inválido", planId = planId, exists = false });
                }

                // Intenta obtener gastos - si el plan no existe, se lanzará la excepción
                await _service.ObtenerGastosPorPlanAsync(planId, incluirResumen: false);
                return Ok(new { planId = planId, exists = true, message = "El plan existe" });
            }
            catch (ArgumentException ex) when (ex.Message.Contains("no existe"))
            {
                return Ok(new { planId = planId, exists = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error verificando plan", details = ex.Message });
            }
        }
    }
} 