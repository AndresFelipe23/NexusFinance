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
    public class ActividadesViajeController : ControllerBase
    {
        private readonly ActividadesViajeService _service;

        public ActividadesViajeController(ActividadesViajeService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearActividadViajeDTO dto)
        {
            Console.WriteLine($"PlanId recibido: {dto.PlanId}");
            Console.WriteLine($"FechaHoraInicio recibida: {dto.FechaHoraInicio}");
            Console.WriteLine($"FechaHoraFin recibida: {dto.FechaHoraFin}");
            var result = await _service.CrearActividadAsync(
                dto.PlanId,
                dto.NombreActividad,
                dto.Descripcion,
                dto.FechaHoraInicio,
                dto.FechaHoraFin,
                dto.CostoEstimado,
                dto.Ubicacion,
                dto.CategoriaViajeId,
                dto.Prioridad,
                dto.UrlReferencia
            );
            Console.WriteLine($"Actividad creada - FechaHoraInicio: {result?.FechaHoraInicio}");
            Console.WriteLine($"Actividad creada - FechaHoraFin: {result?.FechaHoraFin}");
            return Ok(result);
        }

        [HttpPut("{actividadId}")]
        public async Task<IActionResult> Actualizar(Guid actividadId, [FromBody] ActualizarActividadViajeDTO dto)
        {
            if (actividadId != dto.ActividadId)
            {
                return BadRequest("El ID de la actividad en la URL no coincide con el ID en el cuerpo de la solicitud.");
            }

            var result = await _service.ActualizarActividadAsync(
                dto.ActividadId,
                dto.NombreActividad,
                dto.Descripcion,
                dto.FechaHoraInicio,
                dto.FechaHoraFin,
                dto.CostoEstimado,
                dto.CostoReal,
                dto.Ubicacion,
                dto.CategoriaViajeId,
                dto.Prioridad,
                dto.EstadoActividad,
                dto.UrlReferencia
            );
            return Ok(result);
        }

        [HttpDelete("{actividadId}")]
        public async Task<IActionResult> Eliminar(Guid actividadId, [FromQuery] bool eliminacionFisica = false)
        {
            var result = await _service.EliminarActividadAsync(actividadId, eliminacionFisica);
            return Ok(result);
        }

        [HttpGet("{actividadId}")]
        public async Task<IActionResult> ObtenerPorId(Guid actividadId)
        {
            var result = await _service.ObtenerActividadPorIdAsync(actividadId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet("plan/{planId}")]
        public async Task<IActionResult> ObtenerPorPlan(
            Guid planId,
            [FromQuery] string? estadoActividad = null,
            [FromQuery] string? prioridad = null,
            [FromQuery] Guid? categoriaViajeId = null,
            [FromQuery] DateTime? fechaDesde = null,
            [FromQuery] DateTime? fechaHasta = null,
            [FromQuery] bool incluirCanceladas = false,
            [FromQuery] string ordenarPor = "Fecha")
        {
            var result = await _service.ObtenerActividadesPorPlanAsync(
                planId, estadoActividad, prioridad, categoriaViajeId, fechaDesde, fechaHasta, incluirCanceladas, ordenarPor);
            return Ok(result);
        }
    }
} 