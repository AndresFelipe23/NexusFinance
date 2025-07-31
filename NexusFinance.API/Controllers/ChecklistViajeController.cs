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
    public class ChecklistViajeController : ControllerBase
    {
        private readonly ChecklistViajeService _service;

        public ChecklistViajeController(ChecklistViajeService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearChecklistViajeDTO dto)
        {
            var result = await _service.CrearChecklistViajeAsync(dto.PlanId, dto.Item, dto.Descripcion, dto.CategoriaChecklist, dto.FechaLimite, dto.Prioridad, dto.OrdenVisualizacion);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarChecklistViajeDTO dto)
        {
            if (id != dto.ChecklistId)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarChecklistViajeAsync(dto.ChecklistId, dto.Item, dto.Descripcion, dto.CategoriaChecklist, dto.EstaCompletado, dto.FechaLimite, dto.Prioridad, dto.OrdenVisualizacion);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            var result = await _service.EliminarChecklistViajeAsync(id);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerChecklistViajePorIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("plan/{planId}")]
        public async Task<IActionResult> ObtenerPorPlan(Guid planId, [FromQuery] string? categoriaChecklist = null, [FromQuery] bool? estadoCompletado = null, [FromQuery] bool soloVencidos = false, [FromQuery] bool soloProximosVencer = false, [FromQuery] string ordenarPor = "Categoria")
        {
            var result = await _service.ObtenerChecklistPorPlanAsync(planId, categoriaChecklist, estadoCompletado, soloVencidos, soloProximosVencer, ordenarPor);
            return Ok(result);
        }

        [HttpPost("marcar-completado/{id}")]
        public async Task<IActionResult> MarcarCompletado(Guid id, [FromQuery] bool estaCompletado)
        {
            var result = await _service.MarcarCompletadoAsync(id, estaCompletado);
            return Ok(result);
        }

        [HttpGet("resumen/{planId}")]
        public async Task<IActionResult> GetResumen(Guid planId)
        {
            var result = await _service.GetResumenAsync(planId);
            return Ok(result);
        }

        [HttpPost("crear-basico/{planId}")]
        public async Task<IActionResult> CrearChecklistBasico(Guid planId, [FromQuery] bool esViajeInternacional = false)
        {
            var result = await _service.CrearChecklistBasicoAsync(planId, esViajeInternacional);
            return Ok(result);
        }

        [HttpPost("reordenar-items")]
        public async Task<IActionResult> ReordenarItems([FromQuery] Guid planId, [FromQuery] string categoriaChecklist, [FromBody] string listaItems)
        {
            var result = await _service.ReordenarItemsAsync(planId, categoriaChecklist, listaItems);
            return Ok(result);
        }
    }
} 