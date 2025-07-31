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
    public class PlanesVacacioneController : ControllerBase
    {
        private readonly PlanesVacacioneService _service;

        public PlanesVacacioneController(PlanesVacacioneService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearPlanVacacionesDTO dto)
        {
            var result = await _service.CrearPlanAsync(dto.UsuarioId, dto.NombrePlan, dto.Descripcion, dto.Destino, dto.Pais, dto.Ciudad, dto.FechaInicio, dto.FechaFin, dto.CantidadPersonas, dto.PresupuestoEstimado, dto.MonedaDestino, dto.TasaCambio, dto.EsViajeInternacional, dto.MetaFinancieraId);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarPlanVacacionesDTO dto)
        {
            if (id != dto.PlanId) return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarPlanAsync(dto.PlanId, dto.NombrePlan, dto.Descripcion, dto.Destino, dto.Pais, dto.Ciudad, dto.FechaInicio, dto.FechaFin, dto.CantidadPersonas, dto.PresupuestoEstimado, dto.PresupuestoReal, dto.MonedaDestino, dto.TasaCambio, dto.EstadoPlan, dto.EsViajeInternacional, dto.MetaFinancieraId);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id, [FromQuery] bool eliminacionFisica = false)
        {
            var result = await _service.EliminarPlanAsync(id, eliminacionFisica);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerPlanPorIdAsync(id);
            return Ok(result);
        }

        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> ObtenerPorUsuario(Guid usuarioId, [FromQuery] string? estadoPlan = null, [FromQuery] bool soloActivos = true, [FromQuery] string? ordenarPor = "fecha_inicio")
        {
            Console.WriteLine($"UsuarioId recibido: {usuarioId}");
            var result = await _service.ObtenerPlanesPorUsuarioAsync(usuarioId, estadoPlan, soloActivos, ordenarPor);
            return Ok(result);
        }
    }
} 