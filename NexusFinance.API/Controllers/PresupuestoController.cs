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
    public class PresupuestoController : ControllerBase
    {
        private readonly PresupuestoService _service;

        public PresupuestoController(PresupuestoService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearPresupuestoDTO dto)
        {
            var result = await _service.CrearPresupuestoAsync(
                dto.UsuarioId,
                dto.NombrePresupuesto,
                dto.PeriodoPresupuesto,
                dto.FechaInicio,
                dto.FechaFin,
                dto.PresupuestoTotal
            );
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarPresupuestoDTO dto)
        {
            if (id != dto.PresupuestoId)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarPresupuestoAsync(
                dto.PresupuestoId,
                dto.NombrePresupuesto,
                dto.FechaInicio,
                dto.FechaFin,
                dto.PresupuestoTotal,
                dto.EstaActivo
            );
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id, [FromQuery] bool eliminacionFisica = false)
        {
            var result = await _service.EliminarPresupuestoAsync(id, eliminacionFisica);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id, [FromQuery] bool incluirCategorias = true)
        {
            var result = await _service.ObtenerPresupuestoPorIdAsync(id, incluirCategorias);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(
            Guid usuarioId, 
            [FromQuery] string? periodo = null, 
            [FromQuery] bool soloActivos = true, 
            [FromQuery] DateTime? fechaReferencia = null)
        {
            var result = await _service.ObtenerPresupuestosPorUsuarioAsync(usuarioId, fechaReferencia, periodo, soloActivos);
            return Ok(result);
        }
    }
} 