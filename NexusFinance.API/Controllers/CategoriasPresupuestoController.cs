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
    public class CategoriasPresupuestoController : ControllerBase
    {
        private readonly CategoriasPresupuestoService _service;

        public CategoriasPresupuestoController(CategoriasPresupuestoService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearCategoriaPresupuestoDTO dto)
        {
            var result = await _service.CrearCategoriaPresupuestoAsync(dto.PresupuestoId, dto.CategoriaId, dto.MontoAsignado);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarCategoriaPresupuestoDTO dto)
        {
            if (id != dto.CategoriaPresupuestoId)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarCategoriaPresupuestoAsync(dto.CategoriaPresupuestoId, dto.MontoAsignado);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            var result = await _service.EliminarCategoriaPresupuestoAsync(id);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerCategoriaPresupuestoPorIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("presupuesto/{presupuestoId}")]
        public async Task<IActionResult> ObtenerPorPresupuesto(Guid presupuestoId, [FromQuery] bool soloConGastos = false, [FromQuery] string ordenarPor = "nombre")
        {
            var result = await _service.ObtenerCategoriasPorPresupuestoAsync(presupuestoId, soloConGastos, ordenarPor);
            return Ok(result);
        }

        [HttpPost("actualizar-monto-gastado")]
        public async Task<IActionResult> ActualizarMontoGastado([FromQuery] Guid? presupuestoId = null, [FromQuery] Guid? categoriaId = null)
        {
            var result = await _service.ActualizarMontoGastadoAsync(presupuestoId, categoriaId);
            return Ok(result);
        }

        [HttpPost("redistribuir")]
        public async Task<IActionResult> Redistribuir([FromQuery] Guid presupuestoId, [FromQuery] decimal? nuevoPresupuestoTotal = null)
        {
            var result = await _service.RedistribuirAsync(presupuestoId, nuevoPresupuestoTotal);
            return Ok(result);
        }
    }
} 