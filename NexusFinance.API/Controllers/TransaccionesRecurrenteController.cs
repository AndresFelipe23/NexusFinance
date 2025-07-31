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
    public class TransaccionesRecurrenteController : ControllerBase
    {
        private readonly TransaccionesRecurrenteService _service;

        public TransaccionesRecurrenteController(TransaccionesRecurrenteService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearTransaccionRecurrenteDTO dto)
        {
            try
            {
                var result = await _service.CrearTransaccionRecurrenteAsync(
                    dto.UsuarioId, dto.CuentaId, dto.CategoriaId, dto.Monto, dto.TipoTransaccion, dto.Descripcion, dto.Frecuencia, dto.FechaInicio, dto.FechaFin
                );
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(
            Guid usuarioId, 
            [FromQuery] string? tipoTransaccion = null, 
            [FromQuery] string? frecuencia = null, 
            [FromQuery] bool soloActivas = true, 
            [FromQuery] bool soloPendientes = false)
        {
            try
            {
                var result = await _service.ObtenerTransaccionesRecurrentesPorUsuarioAsync(
                    usuarioId, tipoTransaccion, frecuencia, soloActivas, soloPendientes);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{recurrenteId}")]
        public async Task<IActionResult> ObtenerPorId(Guid recurrenteId)
        {
            try
            {
                var result = await _service.ObtenerTransaccionRecurrentePorIdAsync(recurrenteId);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Actualizar([FromBody] ActualizarTransaccionRecurrenteDTO dto)
        {
            try
            {
                var result = await _service.ActualizarTransaccionRecurrenteAsync(
                    dto.RecurrenteId, dto.CuentaId, dto.CategoriaId, dto.Monto, dto.Descripcion, dto.Frecuencia, dto.FechaFin, dto.EstaActivo, dto.RemoverFechaFin);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{recurrenteId}")]
        public async Task<IActionResult> Eliminar(Guid recurrenteId, [FromQuery] bool eliminacionFisica = false)
        {
            try
            {
                var result = await _service.EliminarTransaccionRecurrenteAsync(recurrenteId, eliminacionFisica);
                if (!result) return NotFound();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("frecuencias")]
        public async Task<IActionResult> ObtenerFrecuencias()
        {
            try
            {
                var result = await _service.ObtenerFrecuenciasAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("tipos-transaccion")]
        public async Task<IActionResult> ObtenerTiposTransaccion()
        {
            try
            {
                var result = await _service.ObtenerTiposTransaccionAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
} 