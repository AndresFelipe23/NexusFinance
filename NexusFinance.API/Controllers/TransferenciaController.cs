using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexusFinance.API.Models.DTOs;
using NexusFinance.API.Services;
using System;
using System.Threading.Tasks;
using System.Security.Claims;

namespace NexusFinance.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TransferenciaController : ControllerBase
    {
        private readonly TransferenciaService _service;

        public TransferenciaController(TransferenciaService service)
        {
            _service = service;
        }

        private Guid GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Usuario no autenticado");
            }
            return userId;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearTransferenciaDTO dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (dto.UsuarioId != currentUserId)
                {
                    return Forbid();
                }

                var result = await _service.CrearTransferenciaAsync(
                    dto.UsuarioId, dto.CuentaOrigenId, dto.CuentaDestinoId, dto.Monto, dto.ComisionTransferencia, dto.Descripcion, dto.FechaTransferencia
                );
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(Guid usuarioId)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (usuarioId != currentUserId)
                {
                    return Forbid();
                }

                var result = await _service.ObtenerTransferenciasPorUsuarioAsync(usuarioId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("{transferenciaId}")]
        public async Task<IActionResult> ObtenerPorId(Guid transferenciaId)
        {
            try
            {
                var result = await _service.ObtenerTransferenciaPorIdAsync(transferenciaId);
                if (result == null) return NotFound();
                
                var currentUserId = GetCurrentUserId();
                if (result.UsuarioId != currentUserId)
                {
                    return Forbid();
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Actualizar([FromBody] ActualizarTransferenciaDTO dto)
        {
            try
            {
                var result = await _service.ActualizarTransferenciaAsync(
                    dto.TransferenciaId, dto.CuentaOrigenId, dto.CuentaDestinoId, dto.Monto, dto.ComisionTransferencia, dto.Descripcion, dto.FechaTransferencia
                );
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpDelete("{transferenciaId}")]
        public async Task<IActionResult> Eliminar(Guid transferenciaId)
        {
            try
            {
                var result = await _service.EliminarTransferenciaAsync(transferenciaId);
                if (!result) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("estadisticas/{usuarioId}")]
        public async Task<IActionResult> ObtenerEstadisticas(Guid usuarioId, [FromQuery] DateTime? fechaInicio = null, [FromQuery] DateTime? fechaFin = null)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (usuarioId != currentUserId)
                {
                    return Forbid();
                }

                var result = await _service.ObtenerEstadisticasTransferenciasAsync(usuarioId, fechaInicio, fechaFin);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("periodo/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorPeriodo(Guid usuarioId, [FromQuery] DateTime fechaInicio, [FromQuery] DateTime fechaFin)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                if (usuarioId != currentUserId)
                {
                    return Forbid();
                }

                var result = await _service.ObtenerTransferenciasPorPeriodoAsync(usuarioId, fechaInicio, fechaFin);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
} 