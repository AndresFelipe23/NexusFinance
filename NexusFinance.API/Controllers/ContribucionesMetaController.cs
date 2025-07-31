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
    public class ContribucionesMetaController : ControllerBase
    {
        private readonly ContribucionesMetaService _service;

        public ContribucionesMetaController(ContribucionesMetaService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearContribucionMetaDTO dto)
        {
            var result = await _service.CrearContribucionMetaAsync(dto.MetaId, dto.Monto, dto.FechaContribucion, dto.Notas, dto.TransaccionId, dto.ActualizarMetaAutomaticamente);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarContribucionMetaDTO dto)
        {
            if (id != dto.ContribucionId)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarContribucionMetaAsync(dto.ContribucionId, dto.Monto, dto.FechaContribucion, dto.Notas, dto.ActualizarMetaAutomaticamente);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id, [FromQuery] bool actualizarMetaAutomaticamente = true)
        {
            var result = await _service.EliminarContribucionMetaAsync(id, actualizarMetaAutomaticamente);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerContribucionMetaPorIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("meta/{metaId}")]
        public async Task<IActionResult> ObtenerPorMeta(Guid metaId, [FromQuery] DateTime? fechaInicio = null, [FromQuery] DateTime? fechaFin = null, [FromQuery] string ordenarPor = "fecha_desc")
        {
            var result = await _service.ObtenerContribucionesPorMetaAsync(metaId, fechaInicio, fechaFin, ordenarPor);
            return Ok(result);
        }

        [HttpPost("recalcular-meta/{metaId}")]
        public async Task<IActionResult> RecalcularMeta(Guid metaId)
        {
            var result = await _service.RecalcularMetaAsync(metaId);
            return Ok(result);
        }

        [HttpGet("estadisticas/{metaId}")]
        public async Task<IActionResult> Estadisticas(Guid metaId, [FromQuery] int periodoDias = 30)
        {
            var result = await _service.EstadisticasAsync(metaId, periodoDias);
            return Ok(result);
        }
    }
} 