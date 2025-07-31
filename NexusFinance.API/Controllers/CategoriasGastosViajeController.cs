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
    public class CategoriasGastosViajeController : ControllerBase
    {
        private readonly CategoriasGastosViajeService _service;

        public CategoriasGastosViajeController(CategoriasGastosViajeService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CrearCategoriaGastosViajeDTO dto)
        {
            var result = await _service.CrearCategoriaGastoViajeAsync(
                dto.NombreCategoria, dto.Descripcion, dto.Icono, dto.Color, dto.EsObligatoria, dto.OrdenVisualizacion);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarCategoriaGastosViajeDTO dto)
        {
            if (id != dto.CategoriaViajeId)
                return BadRequest("El id de la ruta no coincide con el del cuerpo.");
            var result = await _service.ActualizarCategoriaGastoViajeAsync(
                dto.CategoriaViajeId, dto.NombreCategoria, dto.Descripcion, dto.Icono, dto.Color, dto.EsObligatoria, dto.OrdenVisualizacion, dto.EstaActivo);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Eliminar(Guid id, [FromQuery] bool eliminacionFisica = false)
        {
            var result = await _service.EliminarCategoriaGastoViajeAsync(id, eliminacionFisica);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerPorId(Guid id)
        {
            var result = await _service.ObtenerCategoriaGastoViajePorIdAsync(id);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> ObtenerTodas([FromQuery] bool soloActivas = true, [FromQuery] bool soloObligatorias = false, [FromQuery] bool incluirEstadisticas = false, [FromQuery] string ordenarPor = "OrdenVisualizacion")
        {
            var result = await _service.ObtenerCategoriasGastosViajeAsync(soloActivas, soloObligatorias, incluirEstadisticas, ordenarPor);
            return Ok(result);
        }

        [HttpPost("reordenar")]
        public async Task<IActionResult> Reordenar([FromBody] string listaCategorias)
        {
            var result = await _service.ReordenarVisualizacionAsync(listaCategorias);
            return Ok(result);
        }

        [HttpPost("inicializar")]
        public async Task<IActionResult> Inicializar()
        {
            var result = await _service.InicializarCategoriasAsync();
            return Ok(result);
        }
    }
} 