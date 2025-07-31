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
    public class PresupuestoViajeController : ControllerBase
    {
        private readonly PresupuestoViajeService _service;

        public PresupuestoViajeController(PresupuestoViajeService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearPresupuestoViajeDTO dto)
        {
            var result = await _service.CrearPresupuestoViajeAsync(dto.PlanId, dto.CategoriaViajeId, dto.PresupuestoEstimado, dto.Notas);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarPresupuestoViajeDTO dto)
        {
            if (id != dto.PresupuestoViajeId)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarPresupuestoViajeAsync(dto.PresupuestoViajeId, dto.PresupuestoEstimado, dto.GastoReal, dto.Notas, dto.ActualizarSoloNotas);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            var result = await _service.EliminarPresupuestoViajeAsync(id);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerPresupuestoViajePorIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("plan/{planId}")]
        public async Task<IActionResult> ObtenerPorPlan(Guid planId, [FromQuery] bool incluirResumen = true, [FromQuery] string ordenarPor = "Categoria")
        {
            var result = await _service.ObtenerPresupuestosPorPlanAsync(planId, incluirResumen, ordenarPor);
            return Ok(result);
        }

        [HttpPost("crear-completo")]
        public async Task<IActionResult> CrearPresupuestoCompleto([FromQuery] Guid planId, [FromQuery] decimal? presupuestoTotal = null, [FromQuery] bool soloObligatorias = true)
        {
            var result = await _service.CrearPresupuestoCompletoAsync(planId, presupuestoTotal, soloObligatorias);
            return Ok(result);
        }

        [HttpPost("actualizar-gastos-reales")]
        public async Task<IActionResult> ActualizarGastosReales([FromQuery] Guid? planId = null, [FromQuery] Guid? categoriaViajeId = null)
        {
            var result = await _service.ActualizarGastosRealesAsync(planId, categoriaViajeId);
            return Ok(result);
        }
    }
} 